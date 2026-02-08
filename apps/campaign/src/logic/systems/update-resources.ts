import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { calculateDistance } from '../utils/calculate-distance'

const RESOURCE_GAIN_RATE = 10
const BONUS_RADIUS = 5000 // 5km
const BONUS_AMOUNT = 5
const RESOURCE_GENERATION_FACTOR = 0.1

export function updateResources(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>,
  delta: number
) {
  const timeFactor = (delta * draft.timeMultiplier) / 1000
  const structures = draft.coalitions[coalition].structures
  // Optimization: Pre-filter bonus structures or spatial index if needed.
  // For now simple O(N^2) loop where N is small (structures) is fine.

  for (const structure of structures) {
    // Only Barrack and Depot structures generate resources
    if (structure.type !== 'Barrack' && structure.type !== 'Depot') continue

    for (const building of structure.buildings) {
      if (!building.alive) continue

      let gain = RESOURCE_GAIN_RATE

      // Check for nearby bonus structures
      for (const otherStructure of structures) {
        if (otherStructure.id === structure.id) continue

        const dist = calculateDistance(structure.position, otherStructure.position)
        if (dist <= BONUS_RADIUS) {
          // Check if it has relevant bonus structure types nearby
          const isBonusType = [
            'Power Plant',
            'Command Center',
            'Fuel Storage',
            'Ammo Depot'
          ].includes(otherStructure.type)
          const hasAliveBuildings = otherStructure.buildings.some((b) => b.alive)

          if (isBonusType && hasAliveBuildings) {
            gain += BONUS_AMOUNT
          }
        }
      }

      building.resources = (building.resources || 0) + gain * timeFactor * RESOURCE_GENERATION_FACTOR
    }
  }
}
