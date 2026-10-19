import { schemas } from '@dcc/contracts'
import { isNativeGciEnabled } from '@dcc/data'
import * as z from 'zod'

import { resolveAiSkill } from './ai-skill'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Mission = z.infer<typeof schemas.dcs.mission>
type Coalition = z.infer<typeof schemas.coalition>

export type MissionIadsConfig = {
  name: string
  samPrefix: string
  ewrPrefix: string
  alwaysOnSamTypes: string[]
  commandCenters: string[]
  powerSources: string[]
  connectionNodes: string[]
}

const IADS_EWR_PREFIX = 'IADS-EWR-'

function isEwrActive(
  campaign: Campaign,
  ewr: NonNullable<Campaign['coalitions']['player']['ewrGroups']>[number]
) {
  return !ewr.destroyed && (!ewr.id.startsWith('gci-ewr-') || isNativeGciEnabled(campaign))
}

const INFRASTRUCTURE_TYPES = {
  commandCenters: 'Command Center',
  powerSources: 'Power Plant',
  connectionNodes: 'Logistics Hub'
} as const

function missionCoalitionKey(coalition: Coalition) {
  return coalition === 'player' ? 'blue' : coalition === 'opponent' ? 'red' : 'neutrals'
}

function nextMissionKey(mission: Mission) {
  mission.currentKey += 1
  return mission.currentKey
}

export function addPersistentEwrGroups(
  mission: Mission,
  campaign: Campaign,
  coalition: Coalition,
  include: (
    ewr: NonNullable<Campaign['coalitions']['player']['ewrGroups']>[number]
  ) => boolean = () => true
) {
  const country = mission.coalition[missionCoalitionKey(coalition)].country?.[0]
  if (!country) return

  if (!country.vehicle) {
    country.vehicle = { group: [] }
  }

  for (const ewr of campaign.coalitions[coalition].ewrGroups ?? []) {
    if (!isEwrActive(campaign, ewr) || !include(ewr)) continue
    const unitName = `${IADS_EWR_PREFIX}Unit-${ewr.id}`
    if (country.vehicle.group.some((group) => group.units.some((unit) => unit.name === unitName)))
      continue

    const groupId = nextMissionKey(mission)
    const unitId = nextMissionKey(mission)
    const groupName = `${IADS_EWR_PREFIX}${ewr.id}-${groupId}`

    country.vehicle?.group.push({
      groupId,
      name: groupName,
      units: [
        {
          unitId,
          name: unitName,
          x: ewr.position.x,
          y: ewr.position.y,
          type: ewr.type,
          heading: 0,
          skill: resolveAiSkill(campaign, coalition, 'High')
        }
      ],
      x: ewr.position.x,
      y: ewr.position.y,
      hidden: false,
      start_time: 0,
      route: {
        points: [
          {
            alt: 0,
            alt_type: 'BARO',
            type: 'Turning Point',
            y: ewr.position.y,
            x: ewr.position.x,
            speed: 0,
            action: 'Off Road',
            ETA: 0,
            ETA_locked: true,
            speed_locked: true,
            formation_template: ''
          }
        ]
      }
    })
  }
}

function collectAliveStructureUnitNames(
  mission: Mission,
  campaign: Campaign,
  coalition: Coalition,
  structureType: string
) {
  const coalitionKey = missionCoalitionKey(coalition)
  const country = mission.coalition[coalitionKey].country?.[0]
  const staticGroups = country?.static?.group ?? []
  const structures = campaign.coalitions[coalition].structures.filter(
    (structure) => structure.type === structureType
  )
  const names: string[] = []

  for (const structure of structures) {
    const groupPrefix = `Static-${structure.id}-`
    for (const group of staticGroups) {
      if (!group.name.startsWith(groupPrefix)) continue
      for (const unit of group.units ?? []) {
        if (typeof unit.name === 'string') {
          names.push(unit.name)
        }
      }
    }
  }

  return names
}

export function buildIadsConfig(mission: Mission, campaign: Campaign): MissionIadsConfig | null {
  if (campaign.campaignParams?.iads === false) return null
  const hasLivingEwr =
    campaign.coalitions.opponent.ewrGroups?.some((ewr) => isEwrActive(campaign, ewr)) ?? false
  if (campaign.coalitions.opponent.samGroups.length === 0 && !hasLivingEwr) return null

  addPersistentEwrGroups(mission, campaign, 'opponent')

  return {
    name: `DCC-${campaign.id}-red`,
    samPrefix: 'SAM-',
    ewrPrefix: IADS_EWR_PREFIX,
    // HAWK needs time to acquire and track fast, low-level Harriers. Skynet's default kill-zone
    // wake-up leaves the radar dark until those aircraft are already at the edge of weapon range.
    alwaysOnSamTypes: campaign.scenarioId === 'falklands-1982' ? ['Hawk'] : [],
    commandCenters: collectAliveStructureUnitNames(
      mission,
      campaign,
      'opponent',
      INFRASTRUCTURE_TYPES.commandCenters
    ),
    powerSources: collectAliveStructureUnitNames(
      mission,
      campaign,
      'opponent',
      INFRASTRUCTURE_TYPES.powerSources
    ),
    connectionNodes: collectAliveStructureUnitNames(
      mission,
      campaign,
      'opponent',
      INFRASTRUCTURE_TYPES.connectionNodes
    )
  }
}
