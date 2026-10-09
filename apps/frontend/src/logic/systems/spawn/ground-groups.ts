import { schemas } from '@dcc/contracts'
import { assignDeploymentSite } from '@dcc/campaign'
import { scenarios, theatres } from '@dcc/data'
import * as z from 'zod'
import { GroundGroup } from '../../entities/ground-group'
import { calculateDistance } from '@/logic/utils/calculate-distance'
import { INFANTRY_COST, VEHICLE_COST } from './ground-group-costs'
import { logSpawnAction } from '@/logic/simulation-log'
import { getAirdromePosition, isAirdromeVulnerable } from '../airport-capture'

const MAX_SPAWNS_PER_TICK = 3
const NM_TO_METERS = 1852
const INFANTRY_MAX_TARGET_RANGE_METERS = 20 * NM_TO_METERS
const VEHICLE_MAX_TARGET_RANGE_METERS = 40 * NM_TO_METERS
const DEFAULT_GROUND_GROUP_SPAWN_MULTIPLIER = 1

function getLocalReplacementPool(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>,
  objectiveId: string
) {
  const pools = (draft.coalitions[coalition].replacementPools ??= {})
  return (pools[objectiveId] ??= {
    readyPersonnel: 0,
    recoveringPersonnel: [],
    equipment: []
  })
}

function consumeFormationAssets(params: {
  draft: z.infer<typeof schemas.campaign.campaign>
  coalition: z.infer<typeof schemas.coalition>
  objectiveId: string
  group: z.infer<typeof schemas.groundGroup>
  kind: 'infantry' | 'vehicle'
  unitName: string
  count: number
}) {
  const pool = getLocalReplacementPool(params.draft, params.coalition, params.objectiveId)
  if (params.kind === 'infantry') {
    // Barrack production enters the local pool before the authorized formation consumes it.
    pool.readyPersonnel += Math.max(0, params.count - pool.readyPersonnel)
    pool.readyPersonnel -= params.count
    return
  }

  const matching = pool.equipment.filter((equipment) => equipment.name === params.unitName)
  for (let index = matching.length; index < params.count; index += 1) {
    pool.equipment.push({
      id: crypto.randomUUID(),
      name: params.unitName,
      condition: 'operational'
    })
  }
  const selected = pool.equipment
    .filter((equipment) => equipment.name === params.unitName)
    .slice(0, params.count)
  const selectedIds = new Set(selected.map((equipment) => equipment.id))
  pool.equipment = pool.equipment.filter((equipment) => !selectedIds.has(equipment.id))
  params.group.units.forEach((unit, index) => {
    const equipment = selected[index]
    if (!equipment) return
    unit.id = equipment.id
    unit.condition = equipment.condition
  })
}

export function spawnGroundGroups(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
): void {
  let spawnsThisTick = 0
  const scenario = scenarios.find((s) => s.id === draft.scenarioId)
  if (!scenario) return

  const theatre = theatres.find((t) => t.name === scenario.theatreName)
  if (!theatre) return

  const enemyCoalition = coalition === 'player' ? 'opponent' : 'player'
  const enemyObjectiveIds = draft.coalitions[enemyCoalition].objectiveIds
  // Red-side campaigns were created from the mirrored scenario, so its sides are swapped here.
  const scenarioCoalition = draft.playerSide === 'red' ? enemyCoalition : coalition
  const maxSpawnsThisTick = Math.max(
    0,
    Math.floor(
      MAX_SPAWNS_PER_TICK *
        (scenario.start[scenarioCoalition].groundGroupSpawnMultiplier ??
          DEFAULT_GROUND_GROUP_SPAWN_MULTIPLIER)
    )
  )

  const structures = draft.coalitions[coalition].structures
  const coalitionData = draft.coalitions[coalition]
  const reservedTargetObjectives = new Set(
    draft.coalitions[coalition].groundGroups
      .map((group) => group.targetObjectiveId)
      .filter((targetObjectiveId): targetObjectiveId is string => targetObjectiveId != null)
  )
  const reservedTargetAirdromes = new Set(
    draft.coalitions[coalition].groundGroups
      .map((group) => group.targetAirdromeName)
      .filter((targetAirdromeName): targetAirdromeName is string => targetAirdromeName != null)
  )

  for (const structure of structures) {
    if (spawnsThisTick >= maxSpawnsThisTick) break

    // Only Barrack and Depot structures can spawn ground groups
    if (structure.type !== 'Barrack' && structure.type !== 'Depot') continue

    const aliveBuildings = structure.buildings.filter((building) => building.alive)
    if (aliveBuildings.length === 0) continue

    for (let i = 0; i < aliveBuildings.length; i++) {
      if (spawnsThisTick >= maxSpawnsThisTick) break

      if (structure.type === 'Barrack' && (structure.resources || 0) >= INFANTRY_COST) {
        const infantryTypes = coalitionData.groundUnitTypes['Infantry']
        const unitName =
          infantryTypes && infantryTypes.length > 0
            ? infantryTypes[Math.floor(Math.random() * infantryTypes.length)]!
            : 'Infantry AK'

        const target = findNearestEnemyGroundTarget(
          draft,
          coalition,
          structure.position,
          enemyObjectiveIds,
          draft.coalitions[enemyCoalition].airdromeNames,
          theatre,
          reservedTargetObjectives,
          reservedTargetAirdromes,
          INFANTRY_MAX_TARGET_RANGE_METERS
        )

        const groundGroupId = GroundGroup.create(draft, coalition, {
          position: structure.position,
          objectiveId: structure.objectiveId,
          units: [{ name: unitName, count: 10 }],
          state: target ? 'moving' : 'idle',
          targetObjectiveId: target?.type === 'objective' ? target.name : undefined,
          targetAirdromeName: target?.type === 'airdrome' ? target.name : undefined
        })
        const groundGroup = draft.coalitions[coalition].groundGroups.find(
          (group) => group.id === groundGroupId
        )
        const site = groundGroup
          ? assignDeploymentSite({
              campaign: draft,
              coalition,
              theatre,
              group: groundGroup,
              objectiveId: structure.objectiveId,
              roles: ['infantry', 'staging'],
              reason: 'creation'
            })
          : null
        if (!groundGroup || !site) {
          draft.coalitions[coalition].groundGroups = draft.coalitions[
            coalition
          ].groundGroups.filter((group) => group.id !== groundGroupId)
          continue
        }
        consumeFormationAssets({
          draft,
          coalition,
          objectiveId: structure.objectiveId,
          group: groundGroup,
          kind: 'infantry',
          unitName,
          count: 10
        })
        const targetLabel =
          target?.type === 'objective'
            ? ` moving to ${target.name}`
            : target?.type === 'airdrome'
              ? ` moving to airport ${target.name}`
              : ''
        logSpawnAction(
          draft,
          coalition,
          `Ground group spawned at ${structure.objectiveId}: 10x ${unitName}${targetLabel}`,
          undefined,
          {
            entityType: 'groundGroup',
            entityId: groundGroupId
          }
        )
        if (target?.type === 'objective') {
          reservedTargetObjectives.add(target.name)
        } else if (target?.type === 'airdrome') {
          reservedTargetAirdromes.add(target.name)
        }
        structure.resources = (structure.resources || 0) - INFANTRY_COST
        spawnsThisTick++
      } else if (structure.type === 'Depot' && (structure.resources || 0) >= VEHICLE_COST) {
        const vehicleTypes = coalitionData.groundUnitTypes['Vehicle']
        const unitName =
          vehicleTypes && vehicleTypes.length > 0
            ? vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)]!
            : 'BMP-2'

        const target = findNearestEnemyGroundTarget(
          draft,
          coalition,
          structure.position,
          enemyObjectiveIds,
          draft.coalitions[enemyCoalition].airdromeNames,
          theatre,
          reservedTargetObjectives,
          reservedTargetAirdromes,
          VEHICLE_MAX_TARGET_RANGE_METERS
        )

        const groundGroupId = GroundGroup.create(draft, coalition, {
          position: structure.position,
          objectiveId: structure.objectiveId,
          units: [{ name: unitName, count: 6 }],
          state: target ? 'moving' : 'idle',
          targetObjectiveId: target?.type === 'objective' ? target.name : undefined,
          targetAirdromeName: target?.type === 'airdrome' ? target.name : undefined
        })
        const groundGroup = draft.coalitions[coalition].groundGroups.find(
          (group) => group.id === groundGroupId
        )
        const site = groundGroup
          ? assignDeploymentSite({
              campaign: draft,
              coalition,
              theatre,
              group: groundGroup,
              objectiveId: structure.objectiveId,
              roles: ['vehicle', 'staging'],
              reason: 'creation'
            })
          : null
        if (!groundGroup || !site) {
          draft.coalitions[coalition].groundGroups = draft.coalitions[
            coalition
          ].groundGroups.filter((group) => group.id !== groundGroupId)
          continue
        }
        consumeFormationAssets({
          draft,
          coalition,
          objectiveId: structure.objectiveId,
          group: groundGroup,
          kind: 'vehicle',
          unitName,
          count: 6
        })
        const targetLabel =
          target?.type === 'objective'
            ? ` moving to ${target.name}`
            : target?.type === 'airdrome'
              ? ` moving to airport ${target.name}`
              : ''
        logSpawnAction(
          draft,
          coalition,
          `Ground group spawned at ${structure.objectiveId}: 6x ${unitName}${targetLabel}`,
          undefined,
          {
            entityType: 'groundGroup',
            entityId: groundGroupId
          }
        )
        if (target?.type === 'objective') {
          reservedTargetObjectives.add(target.name)
        } else if (target?.type === 'airdrome') {
          reservedTargetAirdromes.add(target.name)
        }
        structure.resources = (structure.resources || 0) - VEHICLE_COST
        spawnsThisTick++
      }
    }
  }
}

type GroundTarget = {
  type: 'objective' | 'airdrome'
  name: string
  distance: number
}

function findNearestEnemyGroundTarget(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>,
  position: z.infer<typeof schemas.position>,
  enemyObjectiveIds: string[],
  enemyAirdromeNames: string[],
  theatre: z.infer<typeof schemas.theatre>,
  reservedTargetObjectives: ReadonlySet<string>,
  reservedTargetAirdromes: ReadonlySet<string>,
  maxTargetRangeMeters: number
): GroundTarget | undefined {
  const objectiveTarget = findNearestEnemyObjective(
    position,
    enemyObjectiveIds,
    theatre,
    reservedTargetObjectives,
    maxTargetRangeMeters
  )
  const airdromeTarget = findNearestEnemyAirdrome(
    draft,
    coalition,
    position,
    enemyAirdromeNames,
    theatre,
    reservedTargetAirdromes,
    maxTargetRangeMeters
  )

  if (!objectiveTarget) return airdromeTarget
  if (!airdromeTarget) return objectiveTarget
  return airdromeTarget.distance < objectiveTarget.distance ? airdromeTarget : objectiveTarget
}

function findNearestEnemyObjective(
  position: z.infer<typeof schemas.position>,
  enemyObjectiveIds: string[],
  theatre: z.infer<typeof schemas.theatre>,
  reservedTargetObjectives: ReadonlySet<string>,
  maxTargetRangeMeters: number
): GroundTarget | undefined {
  let nearestTarget: GroundTarget | undefined
  let nearestDist = Infinity

  for (const objId of enemyObjectiveIds) {
    if (reservedTargetObjectives.has(objId)) continue

    const objective = theatre.objectives.find((o) => o.name === objId)
    if (!objective) continue

    const dist = calculateDistance(position, objective.position)
    if (dist > maxTargetRangeMeters) continue

    if (dist < nearestDist) {
      nearestDist = dist
      nearestTarget = {
        type: 'objective',
        name: objId,
        distance: dist
      }
    }
  }

  return nearestTarget
}

function findNearestEnemyAirdrome(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>,
  position: z.infer<typeof schemas.position>,
  enemyAirdromeNames: string[],
  theatre: z.infer<typeof schemas.theatre>,
  reservedTargetAirdromes: ReadonlySet<string>,
  maxTargetRangeMeters: number
): GroundTarget | undefined {
  let nearestTarget: GroundTarget | undefined
  let nearestDist = Infinity

  for (const airdromeName of enemyAirdromeNames) {
    if (reservedTargetAirdromes.has(airdromeName)) continue
    if (!isAirdromeVulnerable(draft, theatre, coalition, airdromeName)) continue

    const airdromePosition = getAirdromePosition(theatre, airdromeName)
    if (!airdromePosition) continue

    const dist = calculateDistance(position, airdromePosition)
    if (dist > maxTargetRangeMeters) continue

    if (dist < nearestDist) {
      nearestDist = dist
      nearestTarget = {
        type: 'airdrome',
        name: airdromeName,
        distance: dist
      }
    }
  }

  return nearestTarget
}
