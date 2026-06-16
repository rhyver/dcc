import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export const MISSION_CULLING_RADIUS_METERS = 10_000

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Theatre = z.infer<typeof schemas.theatre>
type Coalition = z.infer<typeof schemas.coalition>
type CampaignCoalition = Campaign['coalitions'][Coalition]
type GroundGroup = CampaignCoalition['groundGroups'][number]
type Structure = CampaignCoalition['structures'][number]
type Position = z.infer<typeof schemas.position>

export type EmittedGroundGroupCullingMode = 'full' | 'antiAirOnly'
export type GroundGroupCullingMode = EmittedGroundGroupCullingMode | 'omit'

export type MissionCullingManifest = {
  groundGroups: Record<Coalition, Record<string, EmittedGroundGroupCullingMode>>
  structures: Record<Coalition, Record<string, boolean>>
}

export type MissionCullingPlan = {
  enabled: boolean
  manifest: MissionCullingManifest
  getGroundGroupMode: (coalition: Coalition, group: GroundGroup) => GroundGroupCullingMode
  getStructureMode: (coalition: Coalition, structure: Structure) => 'full' | 'omit'
  recordGroundGroup: (
    coalition: Coalition,
    groupId: string,
    mode: EmittedGroundGroupCullingMode
  ) => void
  recordStructure: (coalition: Coalition, structureId: string) => void
}

export function isAirDefenseUnit(unitName: string, coalition: CampaignCoalition) {
  const airDefenseTypes = new Set([
    ...coalition.groundUnitTypes.SAM,
    ...coalition.groundUnitTypes['Shorad Vehicle'],
    ...coalition.groundUnitTypes['Shorad Infantry']
  ])

  return (
    airDefenseTypes.has(unitName) ||
    /\b(aaa|sam|shorad|stinger|igla|linebacker|shilka|osa|tunguska|tor)\b/i.test(unitName)
  )
}

function distance(a: Position, b: Position) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function isNearAnyAnchor(position: Position, anchors: Position[]) {
  return anchors.some((anchor) => distance(position, anchor) <= MISSION_CULLING_RADIUS_METERS)
}

function findObjectivePosition(theatre: Theatre, objectiveId?: string): Position | undefined {
  if (!objectiveId) return undefined
  return theatre.objectives.find((objective) => objective.name === objectiveId)?.position
}

function findAirdromePosition(theatre: Theatre, airdromeName?: string): Position | undefined {
  if (!airdromeName) return undefined
  const airdrome = theatre.airdromeDetails[airdromeName]
  return airdrome ? { x: airdrome.x, y: airdrome.y } : undefined
}

function resolveTargetPosition(
  campaign: Campaign,
  theatre: Theatre,
  target: Campaign['coalitions']['player']['flightGroups'][number]['target']
): Position | undefined {
  if (!target) return undefined

  for (const coalition of Object.values(campaign.coalitions)) {
    const structure = coalition.structures.find((entry) => entry.id === target.id)
    if (structure)
      return structure.position ?? findObjectivePosition(theatre, structure.objectiveId)

    const groundGroup = coalition.groundGroups.find((entry) => entry.id === target.id)
    if (groundGroup) return groundGroup.position

    const sam = coalition.samGroups.find((entry) => entry.id === target.id)
    if (sam) return findObjectivePosition(theatre, sam.objectiveId)
  }

  return findObjectivePosition(theatre, target.objectiveId)
}

function hasAirDefenseUnits(group: GroundGroup, coalition: CampaignCoalition) {
  return group.units.some((unit) => unit.count > 0 && isAirDefenseUnit(unit.name, coalition))
}

function createEmptyManifest(): MissionCullingManifest {
  return {
    groundGroups: { player: {}, opponent: {} },
    structures: { player: {}, opponent: {} }
  }
}

export function buildMissionCullingPlan(campaign: Campaign, theatre: Theatre): MissionCullingPlan {
  const enabled = campaign.campaignParams?.culling !== false
  const anchors: Position[] = []
  const directTargetIds = new Set<string>()

  for (const coalition of Object.values(campaign.coalitions)) {
    for (const flightGroup of coalition.flightGroups) {
      if (flightGroup.target) {
        directTargetIds.add(flightGroup.target.id)
        const targetPosition = resolveTargetPosition(campaign, theatre, flightGroup.target)
        if (targetPosition) anchors.push(targetPosition)
      }

      const destinationPosition =
        findObjectivePosition(theatre, flightGroup.destinationNode) ??
        findAirdromePosition(theatre, flightGroup.destinationNode)
      if (destinationPosition) anchors.push(destinationPosition)

      for (const waypoint of flightGroup.flightplan.waypoints) {
        if (waypoint.name === 'Target' || waypoint.name === 'Direct' || waypoint.type === 'Task') {
          anchors.push(waypoint.position)
        }
      }
    }
  }

  for (const lock of campaign.groundBattleLocks ?? []) {
    if (lock.expiresAt <= campaign.time) continue
    for (const groupId of [...lock.attackerGroupIds, ...lock.defenderGroupIds]) {
      directTargetIds.add(groupId)
      const group =
        campaign.coalitions.player.groundGroups.find((entry) => entry.id === groupId) ??
        campaign.coalitions.opponent.groundGroups.find((entry) => entry.id === groupId)
      if (group) anchors.push(group.position)
    }

    const objectivePosition = findObjectivePosition(theatre, lock.targetObjectiveId)
    if (objectivePosition) anchors.push(objectivePosition)

    const airdromePosition = findAirdromePosition(theatre, lock.targetAirdromeName)
    if (airdromePosition) anchors.push(airdromePosition)
  }

  const includeAll = !enabled || anchors.length === 0
  const manifest = createEmptyManifest()

  return {
    enabled,
    manifest,
    getGroundGroupMode: (coalition, group) => {
      if (includeAll) return 'full'
      if (directTargetIds.has(group.id)) return 'full'
      if (isNearAnyAnchor(group.position, anchors)) return 'full'
      if (hasAirDefenseUnits(group, campaign.coalitions[coalition])) return 'antiAirOnly'
      return 'omit'
    },
    getStructureMode: (_coalition, structure) => {
      if (includeAll) return 'full'
      if (directTargetIds.has(structure.id)) return 'full'
      return isNearAnyAnchor(structure.position, anchors) ? 'full' : 'omit'
    },
    recordGroundGroup: (coalition, groupId, mode) => {
      manifest.groundGroups[coalition][groupId] = mode
    },
    recordStructure: (coalition, structureId) => {
      manifest.structures[coalition][structureId] = true
    }
  }
}
