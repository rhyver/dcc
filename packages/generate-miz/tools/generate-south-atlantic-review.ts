import { assignDeploymentSite } from '@dcc/campaign'
import { schemas } from '@dcc/contracts'
import { factions, scenarios, structureTemplates, templates, theatres } from '@dcc/data'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import * as z from 'zod'

import { generateMizFromCampaign } from '../src/index'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type CampaignCoalition = Campaign['coalitions']['player']
type FlightGroup = z.infer<typeof schemas.flightGroup>
type Position = z.infer<typeof schemas.position>

function flightGroup(params: {
  id: string
  callsign: string
  aircraftName: z.infer<typeof schemas.dcs.aircraftName>
  client?: boolean
  homeBase: string
  home: Position
  target: Position
  startTime: Date
}): FlightGroup {
  const taskTime = new Date(params.startTime.getTime() + 25 * 60 * 1000)
  return {
    id: params.id,
    aircrafts: [
      {
        id: `${params.id}-1`,
        unitName: `${params.callsign}-1`,
        aircraftName: params.aircraftName,
        client: params.client
      }
    ],
    task: 'CAP',
    position: params.home,
    homeBase: params.homeBase,
    callsign: params.callsign,
    tot: taskTime,
    flightplan: {
      id: `${params.id}-plan`,
      startTime: params.startTime,
      waypoints: [
        {
          name: 'Take Off',
          position: params.home,
          altitude: 0,
          speed: 120,
          type: 'TakeOff'
        },
        {
          name: 'Combat Air Patrol',
          position: params.target,
          altitude: 5_500,
          speed: 220,
          type: 'Task'
        },
        {
          name: 'Landing',
          position: params.home,
          altitude: 0,
          speed: 120,
          type: 'Landing'
        }
      ]
    }
  }
}

function emptyCoalition(params: {
  faction: (typeof factions)[number]
  groundUnitTypes: (typeof templates)[number]['groundUnitTypes']
  airdromeNames: string[]
  objectiveIds: string[]
}): CampaignCoalition {
  return {
    id: params.faction.id,
    aircraftTypes: params.faction.aircraftTypes,
    groundUnitTypes: params.groundUnitTypes,
    airdromeNames: params.airdromeNames,
    objectiveIds: params.objectiveIds,
    structures: [],
    samGroups: [],
    groundGroups: [],
    flightGroups: [],
    packages: [],
    replacementPools: {},
    casualtyPoints: [],
    extractionRequests: []
  }
}

const scenario = scenarios.find((entry) => entry.id === 'falklands-1982')
const theatre = theatres.find((entry) => entry.name === 'SouthAtlantic')
const playerFaction = factions.find((entry) => entry.id === 'uk-1982')
const opponentFaction = factions.find((entry) => entry.id === 'argentina-1982-official')
const playerTemplate = templates.find((entry) => entry.name === playerFaction?.templateName)
const opponentTemplate = templates.find((entry) => entry.name === opponentFaction?.templateName)

if (
  !scenario ||
  !theatre ||
  !playerFaction ||
  !opponentFaction ||
  !playerTemplate ||
  !opponentTemplate
) {
  throw new Error('South Atlantic campaign data is incomplete')
}

const carrier = scenario.navalGroups?.player?.find((group) => group.role === 'carrier')
const rioGrande = theatre.airdromeDetails['Rio Grande']
const portStanley = theatre.objectives.find((objective) => objective.name === 'Port Stanley')
if (!carrier || !rioGrande || !portStanley) {
  throw new Error('South Atlantic review mission bases are incomplete')
}

const now = scenario.date
const reviewStructures: CampaignCoalition['structures'] = theatre.objectives.map(
  (objective, index) => {
    const type = index % 2 === 0 ? ('Barrack' as const) : ('Command Center' as const)
    const template = structureTemplates[type][0]
    if (!template) throw new Error(`Missing ${type} structure template`)
    const target = theatre.targets[objective.name]?.find((entry) => entry.type === 'Structure')
    return {
      id: `review-structure-${index + 1}`,
      type,
      objectiveId: objective.name,
      position: target?.position ?? objective.position,
      name: target?.name ?? `${objective.name}|Structure|100`,
      resources: 0,
      buildings: template.buildings.map((building) => ({ ...building, alive: true }))
    }
  }
)

const reviewSiteGroups = (theatre.deploymentSites ?? []).map((site, index) => {
  const allowedKinds = new Set(site.slots.flatMap((slot) => slot.allowedUnitKinds))
  const unitName = site.roles.includes('air-defense')
    ? 'Ural-375 ZU-23'
    : allowedKinds.has('vehicle')
      ? 'M-113'
      : 'Infantry AK'
  const group: z.infer<typeof schemas.groundGroup> = {
    id: `review-site-${index + 1}`,
    objectiveId: site.objectiveId,
    position: site.position,
    state: 'idle',
    units: [{ name: unitName, count: 1 }]
  }
  return { group, site }
})

const campaign: Campaign = {
  version: '0.2.0',
  id: 'south-atlantic-dcs-review',
  name: 'South Atlantic DCS Review',
  createdAt: now,
  updatedAt: now,
  era: scenario.era,
  time: now,
  timeMultiplier: 1,
  status: 'active',
  goal: scenario.goal,
  campaignPhase: 'sea-control',
  campaignParams: {
    culling: false,
    ewr: false,
    iads: false,
    hotStart: false,
    exactTarget: true
  },
  logs: [],
  scenarioId: scenario.id,
  coalitions: {
    player: {
      ...emptyCoalition({
        faction: playerFaction,
        groundUnitTypes: playerTemplate.groundUnitTypes,
        airdromeNames: scenario.start.player.airdromeNames,
        objectiveIds: scenario.start.player.objectiveIds
      }),
      flightGroups: [
        flightGroup({
          id: 'review-uk-cap',
          callsign: 'Colt-1',
          aircraftName: 'AV8BNA',
          client: true,
          homeBase: carrier.id,
          home: carrier.position,
          target: portStanley.position,
          startTime: now
        })
      ],
      navalGroups: structuredClone(scenario.navalGroups?.player ?? [])
    },
    opponent: {
      ...emptyCoalition({
        faction: opponentFaction,
        groundUnitTypes: opponentTemplate.groundUnitTypes,
        airdromeNames: scenario.start.opponent.airdromeNames,
        objectiveIds: scenario.start.opponent.objectiveIds
      }),
      structures: reviewStructures,
      groundGroups: reviewSiteGroups.map(({ group }) => group),
      flightGroups: [
        flightGroup({
          id: 'review-argentine-cap',
          callsign: 'Uzi-1',
          aircraftName: 'Mirage-F1CE',
          homeBase: 'Rio Grande',
          home: rioGrande,
          target: portStanley.position,
          startTime: now
        })
      ],
      navalGroups: structuredClone(scenario.navalGroups?.opponent ?? [])
    }
  }
}

for (const { group, site } of reviewSiteGroups) {
  const assignedSite = assignDeploymentSite({
    campaign,
    coalition: 'opponent',
    theatre,
    group,
    objectiveId: site.objectiveId,
    roles: site.roles,
    siteIds: new Set([site.id]),
    reason: 'creation',
    now
  })
  if (!assignedSite) {
    throw new Error(`Unable to place review formation at ${site.id}`)
  }
}

const parsedCampaign = schemas.campaign.campaign.parse(campaign)
const outputPath = path.resolve(process.argv[2] ?? 'south-atlantic-review.miz')
await mkdir(path.dirname(outputPath), { recursive: true })
const result = await generateMizFromCampaign(parsedCampaign, theatre, outputPath, {
  objectiveSurvey: {
    objectiveIds: theatre.objectives.map((objective) => objective.name),
    radius: 1_500
  }
})
if (result.isErr()) throw result.error

console.log(`South Atlantic DCS review mission: ${outputPath}`)
