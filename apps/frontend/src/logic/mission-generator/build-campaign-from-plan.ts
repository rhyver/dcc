import { schemas, config } from '@dcc/contracts'
import {
  factions as dataFactions,
  scenarios as dataScenarios,
  templates as dataTemplates,
  theatres
} from '@dcc/data'
import * as z from 'zod'

import { ensureRequiredSpawnStructures } from '../campaign/assign-structures'

type MissionPlan = z.infer<typeof schemas.missionGenerator.missionPlan>
type AircraftName = z.infer<typeof schemas.dcs.aircraftName>
type FlightTarget = NonNullable<z.infer<typeof schemas.flightGroup>['target']>
type Theatre = z.infer<typeof schemas.theatre>
type TheatreTarget = z.infer<typeof schemas.target>

function getTheatre(name: string): Theatre | null {
  return theatres.find((theatre) => theatre.name === name) ?? null
}

function isValidAircraftName(value: string): value is AircraftName {
  return schemas.dcs.aircraftName.safeParse(value).success
}

function normalizeAircraftKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function resolveAircraftType(params: {
  requestedAircraftType: string
  preferredTask: z.infer<typeof schemas.task>
  factionAircraftTypes: Record<string, string[]>
}): AircraftName {
  const requested = params.requestedAircraftType.trim()
  if (isValidAircraftName(requested)) {
    return requested
  }

  const taskCandidates = (params.factionAircraftTypes[params.preferredTask] ?? []).filter(
    isValidAircraftName
  )
  const factionCandidates = Object.values(params.factionAircraftTypes)
    .flat()
    .filter(isValidAircraftName)

  const requestedKey = normalizeAircraftKey(requested)
  const fuzzyMatch = factionCandidates.find((candidate) => {
    const candidateKey = normalizeAircraftKey(candidate)
    return candidateKey === requestedKey || candidateKey.includes(requestedKey)
  })
  if (fuzzyMatch) {
    return fuzzyMatch
  }

  return (
    taskCandidates[0] ?? factionCandidates[0] ?? schemas.dcs.aircraftName.options[0] ?? 'F-16C_50'
  )
}

function normalizeLookupKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function resolveAaaUnitName(params: {
  requestedAaaType: string
  opponentGroundUnitTypes: z.infer<typeof schemas.template>['groundUnitTypes']
}) {
  const allCandidates = [
    ...params.opponentGroundUnitTypes['Shorad Vehicle'],
    ...params.opponentGroundUnitTypes['Shorad Infantry'],
    ...params.opponentGroundUnitTypes.Vehicle,
    ...params.opponentGroundUnitTypes.SAM
  ]

  const requested = params.requestedAaaType.trim()
  const requestedKey = normalizeLookupKey(requested)
  const fuzzyMatch = allCandidates.find((candidate) => {
    const candidateKey = normalizeLookupKey(candidate)
    return candidateKey === requestedKey || candidateKey.includes(requestedKey)
  })

  return (
    fuzzyMatch ??
    params.opponentGroundUnitTypes['Shorad Vehicle'][0] ??
    params.opponentGroundUnitTypes['Shorad Infantry'][0] ??
    params.opponentGroundUnitTypes.Vehicle[0] ??
    params.opponentGroundUnitTypes.SAM[0]
  )
}

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

function createAircraft(
  aircraftType: AircraftName,
  count: number,
  callsign: string,
  clientCount = 0
) {
  return Array.from({ length: count }).map((_, index) => ({
    id: crypto.randomUUID(),
    unitName: `${callsign}-${index + 1}`,
    aircraftName: aircraftType,
    ...(index < clientCount ? { client: true } : {})
  }))
}

function createFlightGroup(params: {
  callsign: string
  task: z.infer<typeof schemas.task>
  aircraftType: AircraftName
  count: number
  clientCount?: number
  homeBase: string
  homePosition: z.infer<typeof schemas.position>
  target: FlightTarget
  targetPosition: z.infer<typeof schemas.position>
  tot: Date
  packageId?: string
}) {
  return {
    id: crypto.randomUUID(),
    aircrafts: createAircraft(
      params.aircraftType,
      params.count,
      params.callsign,
      params.clientCount ?? 0
    ),
    task: params.task,
    position: params.homePosition,
    homeBase: params.homeBase,
    callsign: params.callsign,
    target: params.target,
    tot: params.tot,
    flightplan: createFlightplan({
      start: params.homePosition,
      target: params.targetPosition,
      startTime: new Date(params.tot.getTime() - 15 * 60 * 1000)
    }),
    packageId: params.packageId
  } satisfies z.infer<typeof schemas.flightGroup>
}

function resolveFlightGroupCount(task: z.infer<typeof schemas.task>, requestedCount: number) {
  return task === 'CAP' ? config.packages.CAP.aircraftsPerGroup : requestedCount
}

function coerceTask(task: string): z.infer<typeof schemas.task> {
  const allowed = schemas.task.safeParse(task)
  if (allowed.success) {
    return allowed.data
  }
  return 'Ground Attack'
}

function findObjectiveTarget(
  theatre: Theatre,
  objectiveName: string,
  targetType: TheatreTarget['type'] | TheatreTarget['type'][],
  nameIncludes?: string
) {
  const allowedTypes = Array.isArray(targetType) ? new Set(targetType) : new Set([targetType])
  const targets = (theatre.targets[objectiveName] ?? []).filter((target) => {
    if (!allowedTypes.has(target.type)) return false
    if (nameIncludes && !target.name.includes(nameIncludes)) return false
    return true
  })
  if (targets.length === 0) return undefined
  return targets[Math.floor(Math.random() * targets.length)]
}

export function buildCampaignFromPlan(
  plan: MissionPlan
): z.infer<typeof schemas.campaign.campaign> {
  const scenarios = dataScenarios
  const scenario = scenarios.find((entry) => entry.theatreName === plan.theatreName) ?? scenarios[0]
  if (scenario == null) {
    throw new Error('No scenario available to build mission.')
  }

  const theatre = getTheatre(plan.theatreName) ?? getTheatre(scenario.theatreName)
  if (theatre == null) {
    throw new Error(`Theatre not found: ${plan.theatreName}`)
  }

  const factions = dataFactions
  const templates = dataTemplates

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
  const isStrikeMission = playerPrimaryTask === 'Pinpoint Strike'
  const isCasMission = playerPrimaryTask === 'CAS'
  const playerPrimaryAircraftType = resolveAircraftType({
    requestedAircraftType: plan.playerCoalition.primaryFlight.aircraftType,
    preferredTask: playerPrimaryTask,
    factionAircraftTypes: playerFaction.aircraftTypes as Record<string, string[]>
  })

  const fallbackGroundUnitType =
    opponentTemplate.groundUnitTypes.Vehicle[0] ??
    opponentTemplate.groundUnitTypes['Shorad Vehicle'][0] ??
    opponentTemplate.groundUnitTypes.Infantry[0] ??
    opponentTemplate.groundUnitTypes['Shorad Infantry'][0] ??
    opponentTemplate.groundUnitTypes.SAM[0] ??
    opponentTemplate.groundUnitTypes.EWS[0]

  const casTargetGroundGroup =
    isCasMission && fallbackGroundUnitType
      ? (() => {
          const target = findObjectiveTarget(
            theatre,
            primaryTargetObjective.name,
            'Vehicle',
            '|Vehicle|'
          )
          return {
            id: crypto.randomUUID(),
            objectiveId: primaryTargetObjective.name,
            position: target?.position ?? primaryTargetObjective.position,
            state: 'idle',
            units: [{ name: fallbackGroundUnitType, count: 4 }]
          } satisfies z.infer<typeof schemas.groundGroup>
        })()
      : null

  const playerTarget: FlightTarget = casTargetGroundGroup
    ? {
        id: casTargetGroundGroup.id,
        type: 'Ground Group',
        objectiveId: casTargetGroundGroup.objectiveId ?? primaryTargetObjective.name
      }
    : {
        id: crypto.randomUUID(),
        type: 'Objective',
        objectiveId: primaryTargetObjective.name
      }
  const structureTarget = findObjectiveTarget(
    theatre,
    primaryTargetObjective.name,
    'Structure',
    '|Structure|'
  )
  const playerTargetPosition =
    casTargetGroundGroup?.position ?? structureTarget?.position ?? primaryTargetObjective.position

  const playerFlightGroup = createFlightGroup({
    callsign: 'Hammer',
    task: playerPrimaryTask,
    aircraftType: playerPrimaryAircraftType,
    count: resolveFlightGroupCount(playerPrimaryTask, plan.playerCoalition.primaryFlight.count),
    clientCount: 1,
    homeBase: playerHomeBase,
    homePosition: playerHomePosition,
    target: playerTarget,
    targetPosition: playerTargetPosition,
    tot: new Date(missionTime.getTime() + 30 * 60 * 1000),
    packageId
  })

  const opponentCapFlights = plan.opponentCoalition.capFlights.map((capFlight, index) =>
    createFlightGroup({
      callsign: `Bandit${index + 1}`,
      task: 'CAP',
      aircraftType: resolveAircraftType({
        requestedAircraftType: capFlight.aircraftType,
        preferredTask: 'CAP',
        factionAircraftTypes: opponentFaction.aircraftTypes as Record<string, string[]>
      }),
      count: resolveFlightGroupCount('CAP', capFlight.count),
      homeBase: opponentHomeBase,
      homePosition: opponentHomePosition,
      target: {
        id: crypto.randomUUID(),
        type: 'Objective',
        objectiveId: primaryTargetObjective.name
      },
      targetPosition: primaryTargetObjective.position,
      tot: new Date(missionTime.getTime() + 20 * 60 * 1000)
    })
  )

  const supportFlights: z.infer<typeof schemas.flightGroup>[] = []
  if (plan.friendlySupport.awacs) {
    const awacsType = resolveAircraftType({
      requestedAircraftType: plan.playerCoalition.primaryFlight.aircraftType,
      preferredTask: 'AWACS',
      factionAircraftTypes: playerFaction.aircraftTypes as Record<string, string[]>
    })
    supportFlights.push(
      createFlightGroup({
        callsign: 'Magic',
        task: 'AWACS',
        aircraftType: awacsType,
        count: 1,
        homeBase: playerHomeBase,
        homePosition: playerHomePosition,
        target: {
          id: crypto.randomUUID(),
          type: 'Objective',
          objectiveId: primaryTargetObjective.name
        },
        targetPosition: primaryTargetObjective.position,
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
  const playerObjectiveIds = scenario.start.player.objectiveIds.filter((id) => objectiveMap.has(id))

  const getObjectiveInfos = (objectiveIds: string[]) =>
    objectiveIds
      .map((id) => objectiveMap.get(id))
      .filter((objective): objective is z.infer<typeof schemas.objective> => objective != null)
      .map((objective) => ({
        id: objective.name,
        position: objective.position,
        targets: (theatre.targets[objective.name] ?? []).map((target) => ({
          name: target.name,
          type: target.type,
          position: target.position
        }))
      }))

  const withStructureIds = (
    assignments: ReturnType<typeof ensureRequiredSpawnStructures>
  ): z.infer<typeof schemas.campaign.campaign>['coalitions']['player']['structures'] =>
    assignments.map((assignment) => ({
      id: crypto.randomUUID(),
      type: assignment.type,
      objectiveId: assignment.objectiveId,
      position: assignment.position,
      name: assignment.name,
      resources: assignment.resources,
      buildings: assignment.buildings
    }))

  const playerSpawnStructures = withStructureIds(
    ensureRequiredSpawnStructures([], getObjectiveInfos(playerObjectiveIds))
  )
  const opponentSpawnStructures = withStructureIds(
    ensureRequiredSpawnStructures([], getObjectiveInfos(opponentObjectiveIds))
  )

  const samGroups = plan.opponentCoalition.samPlacements
    .filter((placement) => objectiveMap.has(placement.objectiveName))
    .map((placement) => ({
      id: crypto.randomUUID(),
      type: placement.samType,
      objectiveId: placement.objectiveName
    }))

  const aaaGroundGroups: z.infer<typeof schemas.groundGroup>[] = []
  for (const placement of plan.opponentCoalition.aaaPlacements) {
    const objective = objectiveMap.get(placement.objectiveName)
    if (!objective) continue

    const unitName = resolveAaaUnitName({
      requestedAaaType: placement.aaaType,
      opponentGroundUnitTypes: opponentTemplate.groundUnitTypes
    })
    if (!unitName) continue

    aaaGroundGroups.push({
      id: crypto.randomUUID(),
      objectiveId: placement.objectiveName,
      position:
        findObjectiveTarget(theatre, placement.objectiveName, 'Vehicle', '|Vehicle|')?.position ??
        objective.position,
      state: 'idle',
      units: [{ name: unitName, count: placement.count }]
    })
  }

  const targetStructure = structureTarget
    ? ({
        id: playerFlightGroup.target?.id ?? crypto.randomUUID(),
        type: 'Ammo Depot',
        objectiveId: primaryTargetObjective.name,
        position: structureTarget.position,
        name: structureTarget.name,
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
      >['coalitions']['opponent']['structures'][number])
    : null

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

  const now = new Date()

  const campaign: z.infer<typeof schemas.campaign.campaign> = {
    version: '0.0.1',
    id: crypto.randomUUID(),
    name: plan.title,
    createdAt: now,
    updatedAt: now,
    time: missionTime,
    timeMultiplier: 0,
    status: 'active',
    goal: scenario.goal,
    logs: [],
    scenarioId: scenario.id,
    coalitions: {
      player: {
        id: playerFaction.id,
        aircraftTypes: playerFaction.aircraftTypes,
        groundUnitTypes: playerTemplate.groundUnitTypes,
        airdromeNames: [playerHomeBase],
        objectiveIds: playerObjectiveIds,
        structures: playerSpawnStructures,
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
        structures: [
          ...opponentSpawnStructures,
          ...(isStrikeMission && targetStructure ? [targetStructure] : [])
        ],
        samGroups,
        groundGroups: [...aaaGroundGroups, ...(casTargetGroundGroup ? [casTargetGroundGroup] : [])],
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
