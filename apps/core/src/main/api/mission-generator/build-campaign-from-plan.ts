import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { getFactions } from '../data/get-factions'
import { getScenarios } from '../data/get-scenarios'
import { getTemplates } from '../data/get-templates'
import { getTheatre } from '../data/get-theatre'

type MissionPlan = z.infer<typeof schemas.missionGenerator.missionPlan>

function createFlightplan(params: {
  start: z.infer<typeof schemas.position>
  target: z.infer<typeof schemas.position>
  startTime: Date
}): z.infer<typeof schemas.flightplan> {
  const midpoint = {
    x: (params.start.x + params.target.x) / 2,
    y: (params.start.y + params.target.y) / 2
  }

  return {
    id: crypto.randomUUID(),
    startTime: params.startTime,
    waypoints: [
      { name: 'Takeoff', position: params.start, altitude: 100, speed: 180, type: 'TakeOff' },
      { name: 'Ingress', position: midpoint, altitude: 5500, speed: 220, type: 'Nav' },
      { name: 'IP', position: params.target, altitude: 5500, speed: 220, type: 'Task' },
      { name: 'RTB', position: params.start, altitude: 3000, speed: 220, type: 'Nav' },
      { name: 'Landing', position: params.start, altitude: 100, speed: 160, type: 'Landing' }
    ]
  }
}

function createAircraft(aircraftType: string, count: number, clientCount = 0) {
  return Array.from({ length: count }).map((_, index) => ({
    id: crypto.randomUUID(),
    unitName: `${aircraftType}-${index + 1}`,
    aircraftName: aircraftType as z.infer<typeof schemas.dcs.aircraftName>,
    ...(index < clientCount ? { client: true } : {})
  }))
}

function createFlightGroup(params: {
  callsign: string
  task: z.infer<typeof schemas.task>
  aircraftType: string
  count: number
  clientCount?: number
  homeBase: string
  homePosition: z.infer<typeof schemas.position>
  targetObjective: z.infer<typeof schemas.objective>
  tot: Date
  packageId?: string
}) {
  return {
    id: crypto.randomUUID(),
    aircrafts: createAircraft(params.aircraftType, params.count, params.clientCount ?? 0),
    task: params.task,
    position: params.homePosition,
    homeBase: params.homeBase,
    callsign: params.callsign,
    target: {
      id: crypto.randomUUID(),
      type: 'Objective',
      objectiveId: params.targetObjective.name
    },
    tot: params.tot,
    flightplan: createFlightplan({
      start: params.homePosition,
      target: params.targetObjective.position,
      startTime: new Date(params.tot.getTime() - 15 * 60 * 1000)
    }),
    packageId: params.packageId
  } satisfies z.infer<typeof schemas.flightGroup>
}

function coerceTask(task: string): z.infer<typeof schemas.task> {
  const allowed = schemas.task.safeParse(task)
  if (allowed.success) {
    return allowed.data
  }
  return 'Ground Attack'
}

export function buildCampaignFromPlan(
  plan: MissionPlan
): z.infer<typeof schemas.campaign.campaign> {
  const scenarios = getScenarios()
  const scenario = scenarios.find((entry) => entry.theatreName === plan.theatreName) ?? scenarios[0]
  if (scenario == null) {
    throw new Error('No scenario available to build mission.')
  }

  const theatre = getTheatre(plan.theatreName) ?? getTheatre(scenario.theatreName)
  if (theatre == null) {
    throw new Error(`Theatre not found: ${plan.theatreName}`)
  }

  const factions = getFactions()
  const templates = getTemplates()

  const playerFaction =
    factions.find((faction) => faction.id === plan.playerCoalition.factionId) ??
    factions.find((faction) => faction.id === 'usa-2004') ??
    factions[0]
  const opponentFaction =
    factions.find((faction) => faction.id === plan.opponentCoalition.factionId) ??
    factions.find((faction) => faction.id === 'russia-1996') ??
    factions[1]

  if (playerFaction == null || opponentFaction == null) {
    throw new Error('Unable to resolve factions for mission generation.')
  }

  const playerTemplate = templates.find((template) => template.name === playerFaction.templateName)
  const opponentTemplate = templates.find(
    (template) => template.name === opponentFaction.templateName
  )
  if (playerTemplate == null || opponentTemplate == null) {
    throw new Error('Unable to resolve faction templates for mission generation.')
  }

  const objectiveMap = new Map(theatre.objectives.map((objective) => [objective.name, objective]))
  const missionObjectives = plan.objectiveNames
    .map((name) => objectiveMap.get(name))
    .filter((objective): objective is z.infer<typeof schemas.objective> => objective != null)
  const primaryTargetObjective = missionObjectives[0] ?? theatre.objectives[0]
  if (primaryTargetObjective == null) {
    throw new Error('No theatre objective available for mission generation.')
  }

  const playerAirdromes = scenario.start.player.airdromeNames.filter(
    (name) => theatre.airdromeDetails[name] != null
  )
  const opponentAirdromes = scenario.start.opponent.airdromeNames.filter(
    (name) => theatre.airdromeDetails[name] != null
  )
  const allAirdromes = Object.keys(theatre.airdromeDetails)

  const playerHomeBase =
    theatre.airdromeDetails[plan.playerCoalition.primaryFlight.homeAirbase] != null
      ? plan.playerCoalition.primaryFlight.homeAirbase
      : (playerAirdromes[0] ?? allAirdromes[0])
  const opponentHomeBase = opponentAirdromes[0] ?? allAirdromes[1] ?? allAirdromes[0]

  if (!playerHomeBase || !opponentHomeBase) {
    throw new Error('No usable airdrome found in theatre.')
  }

  const playerHomePosition = theatre.airdromeDetails[playerHomeBase]
  const opponentHomePosition = theatre.airdromeDetails[opponentHomeBase]
  if (!playerHomePosition || !opponentHomePosition) {
    throw new Error('Airdrome details are missing for selected bases.')
  }

  const missionTime = plan.startTimeZulu ? new Date(plan.startTimeZulu) : new Date(scenario.date)
  const packageId = crypto.randomUUID()

  const playerPrimaryTask = coerceTask(plan.playerCoalition.primaryFlight.task)
  const playerFlightGroup = createFlightGroup({
    callsign: 'Hammer',
    task: playerPrimaryTask,
    aircraftType: plan.playerCoalition.primaryFlight.aircraftType,
    count: plan.playerCoalition.primaryFlight.count,
    clientCount: 1,
    homeBase: playerHomeBase,
    homePosition: playerHomePosition,
    targetObjective: primaryTargetObjective,
    tot: new Date(missionTime.getTime() + 30 * 60 * 1000),
    packageId
  })

  const opponentCapFlights = plan.opponentCoalition.capFlights.map((capFlight, index) =>
    createFlightGroup({
      callsign: `Bandit${index + 1}`,
      task: 'CAP',
      aircraftType: capFlight.aircraftType,
      count: capFlight.count,
      homeBase: opponentHomeBase,
      homePosition: opponentHomePosition,
      targetObjective: primaryTargetObjective,
      tot: new Date(missionTime.getTime() + 20 * 60 * 1000)
    })
  )

  const supportFlights: z.infer<typeof schemas.flightGroup>[] = []
  if (plan.friendlySupport.awacs) {
    const awacsType =
      playerFaction.aircraftTypes.AWACS[0] ?? plan.playerCoalition.primaryFlight.aircraftType
    supportFlights.push(
      createFlightGroup({
        callsign: 'Magic',
        task: 'AWACS',
        aircraftType: awacsType,
        count: 1,
        homeBase: playerHomeBase,
        homePosition: playerHomePosition,
        targetObjective: primaryTargetObjective,
        tot: new Date(missionTime.getTime() + 10 * 60 * 1000)
      })
    )
  }

  const opponentObjectiveIds = Array.from(
    new Set([
      ...scenario.start.opponent.objectiveIds.filter((id) => objectiveMap.has(id)),
      ...missionObjectives.map((objective) => objective.name)
    ])
  )

  const samGroups = plan.opponentCoalition.samPlacements
    .filter((placement) => objectiveMap.has(placement.objectiveName))
    .map((placement) => ({
      id: crypto.randomUUID(),
      type: placement.samType,
      objectiveId: placement.objectiveName
    }))

  const targetStructure = {
    id: playerFlightGroup.target?.id ?? crypto.randomUUID(),
    type: 'Ammo Depot',
    objectiveId: primaryTargetObjective.name,
    position: primaryTargetObjective.position,
    name: `Objective ${primaryTargetObjective.name}`,
    resources: 100,
    buildings: [
      {
        offset: { x: 0, y: 0 },
        type: 'Workshop A',
        alive: true
      }
    ]
  } satisfies z.infer<
    typeof schemas.campaign.campaign
  >['coalitions']['opponent']['structures'][number]

  const missionPackage = {
    id: packageId,
    type: 'Strike Package',
    targetObjectiveId: primaryTargetObjective.name,
    members: [
      {
        flightGroupId: playerFlightGroup.id,
        role: 'primary',
        totOffset: 0
      }
    ],
    tot: playerFlightGroup.tot ?? missionTime,
    status: 'active'
  } satisfies z.infer<typeof schemas.missionPackage>

  const campaign: z.infer<typeof schemas.campaign.campaign> = {
    version: '0.0.1',
    id: crypto.randomUUID(),
    name: plan.title,
    createdAt: new Date(),
    time: missionTime,
    timeMultiplier: 0,
    logs: [],
    scenarioId: scenario.id,
    coalitions: {
      player: {
        id: playerFaction.id,
        aircraftTypes: playerFaction.aircraftTypes,
        groundUnitTypes: playerTemplate.groundUnitTypes,
        airdromeNames: [playerHomeBase],
        objectiveIds: scenario.start.player.objectiveIds.filter((id) => objectiveMap.has(id)),
        structures: [],
        samGroups: [],
        groundGroups: [],
        flightGroups: [playerFlightGroup, ...supportFlights],
        packages: [missionPackage]
      },
      opponent: {
        id: opponentFaction.id,
        aircraftTypes: opponentFaction.aircraftTypes,
        groundUnitTypes: opponentTemplate.groundUnitTypes,
        airdromeNames: [opponentHomeBase],
        objectiveIds: opponentObjectiveIds,
        structures: [targetStructure],
        samGroups,
        groundGroups: [],
        flightGroups: opponentCapFlights,
        packages: []
      }
    }
  }

  const parsed = schemas.campaign.campaign.safeParse(campaign)
  if (!parsed.success) {
    throw new Error(`Failed to build campaign: ${parsed.error.message}`)
  }

  return parsed.data
}
