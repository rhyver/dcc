import { schemas } from '@dcc/contracts'
import { scenarios, theatres } from '@dcc/data'
import * as z from 'zod'
import { GroundGroup } from '../../entities/ground-group'
import { calculateDistance } from '@/logic/utils/calculate-distance'
import { INFANTRY_COST, VEHICLE_COST } from './ground-group-costs'
import { logSpawnAction } from '@/logic/simulation-log'

const MAX_SPAWNS_PER_TICK = 3
const NM_TO_METERS = 1852
const INFANTRY_MAX_TARGET_RANGE_METERS = 20 * NM_TO_METERS
const VEHICLE_MAX_TARGET_RANGE_METERS = 40 * NM_TO_METERS

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

  const structures = draft.coalitions[coalition].structures
  const coalitionData = draft.coalitions[coalition]
  const reservedTargetObjectives = new Set(
    draft.coalitions[coalition].groundGroups
      .map((group) => group.targetObjectiveId)
      .filter((targetObjectiveId): targetObjectiveId is string => targetObjectiveId != null)
  )

  for (const structure of structures) {
    if (spawnsThisTick >= MAX_SPAWNS_PER_TICK) break

    // Only Barrack and Depot structures can spawn ground groups
    if (structure.type !== 'Barrack' && structure.type !== 'Depot') continue

    const aliveBuildings = structure.buildings.filter((building) => building.alive)
    if (aliveBuildings.length === 0) continue

    for (let i = 0; i < aliveBuildings.length; i++) {
      if (spawnsThisTick >= MAX_SPAWNS_PER_TICK) break

      if (structure.type === 'Barrack' && (structure.resources || 0) >= INFANTRY_COST) {
        const infantryTypes = coalitionData.groundUnitTypes['Infantry']
        const unitName =
          infantryTypes && infantryTypes.length > 0
            ? infantryTypes[Math.floor(Math.random() * infantryTypes.length)]!
            : 'Infantry AK'

        const targetObjectiveId = findNearestEnemyObjective(
          structure.position,
          enemyObjectiveIds,
          theatre,
          reservedTargetObjectives,
          INFANTRY_MAX_TARGET_RANGE_METERS
        )

        const groundGroupId = GroundGroup.create(draft, coalition, {
          position: structure.position,
          objectiveId: structure.objectiveId,
          units: [{ name: unitName, count: 10 }],
          state: targetObjectiveId ? 'moving' : 'idle',
          targetObjectiveId
        })
        logSpawnAction(
          draft,
          coalition,
          `Ground group spawned at ${structure.objectiveId}: 10x ${unitName}${targetObjectiveId ? ` moving to ${targetObjectiveId}` : ''}`,
          undefined,
          {
            entityType: 'groundGroup',
            entityId: groundGroupId
          }
        )
        if (targetObjectiveId != null) {
          reservedTargetObjectives.add(targetObjectiveId)
        }
        structure.resources = (structure.resources || 0) - INFANTRY_COST
        spawnsThisTick++
      } else if (structure.type === 'Depot' && (structure.resources || 0) >= VEHICLE_COST) {
        const vehicleTypes = coalitionData.groundUnitTypes['Vehicle']
        const unitName =
          vehicleTypes && vehicleTypes.length > 0
            ? vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)]!
            : 'BMP-2'

        const targetObjectiveId = findNearestEnemyObjective(
          structure.position,
          enemyObjectiveIds,
          theatre,
          reservedTargetObjectives,
          VEHICLE_MAX_TARGET_RANGE_METERS
        )

        const groundGroupId = GroundGroup.create(draft, coalition, {
          position: structure.position,
          objectiveId: structure.objectiveId,
          units: [{ name: unitName, count: 3 }],
          state: targetObjectiveId ? 'moving' : 'idle',
          targetObjectiveId
        })
        logSpawnAction(
          draft,
          coalition,
          `Ground group spawned at ${structure.objectiveId}: 3x ${unitName}${targetObjectiveId ? ` moving to ${targetObjectiveId}` : ''}`,
          undefined,
          {
            entityType: 'groundGroup',
            entityId: groundGroupId
          }
        )
        if (targetObjectiveId != null) {
          reservedTargetObjectives.add(targetObjectiveId)
        }
        structure.resources = (structure.resources || 0) - VEHICLE_COST
        spawnsThisTick++
      }
    }
  }
}

function findNearestEnemyObjective(
  position: z.infer<typeof schemas.position>,
  enemyObjectiveIds: string[],
  theatre: z.infer<typeof schemas.theatre>,
  reservedTargetObjectives: ReadonlySet<string>,
  maxTargetRangeMeters: number
): string | undefined {
  let nearestId: string | undefined
  let nearestDist = Infinity

  for (const objId of enemyObjectiveIds) {
    if (reservedTargetObjectives.has(objId)) continue

    const objective = theatre.objectives.find((o) => o.name === objId)
    if (!objective) continue

    const dist = calculateDistance(position, objective.position)
    if (dist > maxTargetRangeMeters) continue

    if (dist < nearestDist) {
      nearestDist = dist
      nearestId = objId
    }
  }

  return nearestId
}
