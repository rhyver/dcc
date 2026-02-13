import { schemas } from '@dcc/contracts'
import type * as z from 'zod'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type Supply = z.infer<typeof schemas.supply>

/**
 * Updates supply levels for all nodes (objectives + airdromes)
 * Runs every logic tick (1 second intervals)
 */
export function updateSupply(draft: Campaign, coalition: Coalition): void {
  const supplyNodes = draft.coalitions[coalition].supplyNodes
  if (!supplyNodes) return

  // Update each supply node
  for (const supply of Object.values(supplyNodes)) {
    updateNodeSupply(supply)
  }
}

function updateNodeSupply(supply: Supply): void {
  // Apply production and consumption
  supply.current += supply.productionRate
  supply.current -= supply.consumptionRate

  // Clamp to bounds
  supply.current = Math.max(0, Math.min(supply.max, supply.current))

  // Update status based on percentage
  const percentage = supply.current / supply.max
  if (percentage > 0.75) supply.status = 'abundant'
  else if (percentage > 0.5) supply.status = 'adequate'
  else if (percentage > 0.25) supply.status = 'low'
  else if (percentage > 0.05) supply.status = 'critical'
  else supply.status = 'depleted'
}

/**
 * Calculate consumption rate based on hosted units
 */
export function calculateConsumptionRate(
  draft: Campaign,
  nodeId: string,
  coalition: Coalition
): number {
  let rate = 0

  // Ground units: 2 points per unit per tick
  const groundGroups = draft.coalitions[coalition].groundGroups.filter(
    (g) => g.objectiveId === nodeId
  )
  for (const group of groundGroups) {
    rate += group.units.reduce((sum, unit) => sum + unit.count * 2, 0)
  }

  // SAM sites: 5 points per tick when active
  const samGroups = draft.coalitions[coalition].samGroups.filter(
    (sam) => sam.objectiveId === nodeId
  )
  rate += samGroups.length * 5

  return rate
}

/**
 * Get supply for a node (objective or airdrome)
 */
export function getNodeSupply(
  draft: Campaign,
  coalition: Coalition,
  nodeId: string
): Supply | undefined {
  return draft.coalitions[coalition].supplyNodes?.[nodeId]
}
