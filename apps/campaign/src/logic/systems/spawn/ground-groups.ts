import { schemas } from '@dcc/contracts'
import { scenarios, theatres } from '@dcc/data'
import * as z from 'zod'
import { GroundGroup } from '../../entities/ground-group'
import { calculateDistance } from '@/logic/utils/calculate-distance'

const INFANTRY_COST = 500 // Adjusted cost to be higher than per-tick gain
const VEHICLE_COST = 1000

export function spawnGroundGroups(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
): void {
  const scenario = scenarios.find((s) => s.id === draft.scenarioId)
  if (!scenario) return

  const theatre = theatres.find((t) => t.name === scenario.theatreName)
  if (!theatre) return

  const enemyCoalition = coalition === 'player' ? 'opponent' : 'player'
  const enemyObjectiveIds = draft.coalitions[enemyCoalition].objectiveIds

  const structures = draft.coalitions[coalition].structures
  const coalitionData = draft.coalitions[coalition]

  for (const structure of structures) {
    // Only Barrack and Depot structures can spawn ground groups
    if (structure.type !== 'Barrack' && structure.type !== 'Depot') continue

    for (const building of structure.buildings) {
      if (!building.alive) continue

      if (structure.type === 'Barrack' && (building.resources || 0) >= INFANTRY_COST) {
        const infantryTypes = coalitionData.groundUnitTypes['Infantry']
        const unitName =
          infantryTypes && infantryTypes.length > 0
            ? infantryTypes[Math.floor(Math.random() * infantryTypes.length)]!
            : 'Infantry AK'

        const targetObjectiveId = findNearestEnemyObjective(
          structure.position,
          enemyObjectiveIds,
          theatre
        )

        GroundGroup.create(draft, coalition, {
          position: structure.position,
          objectiveId: structure.objectiveId,
          units: [{ name: unitName, count: 10 }],
          state: targetObjectiveId ? 'moving' : 'idle',
          targetObjectiveId
        })
        building.resources -= INFANTRY_COST
      } else if (structure.type === 'Depot' && (building.resources || 0) >= VEHICLE_COST) {
        const vehicleTypes = coalitionData.groundUnitTypes['Vehicle']
        const unitName =
          vehicleTypes && vehicleTypes.length > 0
            ? vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)]!
            : 'BMP-2'

        const targetObjectiveId = findNearestEnemyObjective(
          structure.position,
          enemyObjectiveIds,
          theatre
        )

        GroundGroup.create(draft, coalition, {
          position: structure.position,
          objectiveId: structure.objectiveId,
          units: [{ name: unitName, count: 3 }],
          state: targetObjectiveId ? 'moving' : 'idle',
          targetObjectiveId
        })
        building.resources -= VEHICLE_COST
      }
    }
  }
}

function findNearestEnemyObjective(
  position: z.infer<typeof schemas.position>,
  enemyObjectiveIds: string[],
  theatre: z.infer<typeof schemas.theatre>
): string | undefined {
  let nearestId: string | undefined
  let nearestDist = Infinity

  for (const objId of enemyObjectiveIds) {
    const objective = theatre.objectives.find((o) => o.name === objId)
    if (!objective) continue

    const dist = calculateDistance(position, objective.position)
    if (dist < nearestDist) {
      nearestDist = dist
      nearestId = objId
    }
  }

  return nearestId
}
