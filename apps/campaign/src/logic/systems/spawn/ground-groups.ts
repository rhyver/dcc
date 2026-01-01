import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { GroundGroup } from '../../entities/ground-group'

const INFANTRY_COST = 500 // Adjusted cost to be higher than per-tick gain
const VEHICLE_COST = 1000

export function spawnGroundGroups(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  const structures = draft.coalitions[coalition].structures

  for (const structure of structures) {
    // Only Barrack and Depot structures can spawn ground groups
    if (structure.type !== 'Barrack' && structure.type !== 'Depot') continue

    for (const building of structure.buildings) {
      if (!building.alive) continue

      if (structure.type === 'Barrack' && (building.resources || 0) >= INFANTRY_COST) {
        // Spawn Infantry from Barrack
        GroundGroup.create(draft, coalition, {
          position: structure.position,
          units: [{ name: 'Infantry AK', count: 10 }],
          state: 'idle'
        })
        building.resources -= INFANTRY_COST
      } else if (structure.type === 'Depot' && (building.resources || 0) >= VEHICLE_COST) {
        // Spawn Vehicle from Depot
        GroundGroup.create(draft, coalition, {
          position: structure.position,
          units: [{ name: 'BMP-2', count: 3 }],
          state: 'idle'
        })
        building.resources -= VEHICLE_COST
      }
    }
  }
}
