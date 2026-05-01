import { schemas } from '@dcc/contracts'
import { isSamOperational, samTemplates } from '@dcc/data'
import * as z from 'zod'
import { calculateDistance } from './calculate-distance'
import { getObjectivePosition } from './get-objective-position'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type SupplyStatus = z.infer<typeof schemas.supplyStatus>

/**
 * Calculate SAM engagement range multiplier based on supply status
 */
function getSupplyRangeMultiplier(supplyStatus: SupplyStatus | undefined): number {
  if (!supplyStatus) return 1.0

  switch (supplyStatus) {
    case 'abundant':
    case 'adequate':
      return 1.0
    case 'low':
      return 0.75 // 25% reduction
    case 'critical':
      return 0.5 // 50% reduction
    case 'depleted':
      return 0 // SAMs offline
  }
}

export type ThreateningSam = {
  samGroup: z.infer<typeof schemas.campaign.campaignSamGroup>
  position: z.infer<typeof schemas.position>
  range: number
  distance: number
}

export function findThreateningSams(
  targetPosition: z.infer<typeof schemas.position>,
  enemySamGroups: z.infer<typeof schemas.campaign.campaignSamGroup>[],
  theatre: z.infer<typeof schemas.theatre>,
  campaign?: Campaign,
  coalition?: Coalition
): ThreateningSam[] {
  const threateningSams: ThreateningSam[] = []

  for (const samGroup of enemySamGroups) {
    // Skip SAMs that have lost required fire-control components.
    if (!isSamOperational(samGroup)) {
      continue
    }

    const samPosition = getObjectivePosition(theatre, samGroup.objectiveId)
    if (!samPosition) {
      continue
    }

    const samTemplate = samTemplates[samGroup.type]
    if (!samTemplate) {
      continue
    }

    // Apply supply modifier to SAM range
    let effectiveRange = samTemplate.range
    if (campaign && coalition) {
      const supplyNodes = campaign.coalitions[coalition].supplyNodes
      const supply = supplyNodes?.[samGroup.objectiveId]
      const multiplier = getSupplyRangeMultiplier(supply?.status)
      effectiveRange = samTemplate.range * multiplier
    }

    const distance = calculateDistance(targetPosition, samPosition)

    // Check if target is within SAM engagement range
    if (distance <= effectiveRange) {
      threateningSams.push({
        samGroup,
        position: samPosition,
        range: effectiveRange,
        distance
      })
    }
  }

  // Sort by distance (closest first)
  threateningSams.sort((a, b) => a.distance - b.distance)

  return threateningSams
}

export function getClosestThreateningSam(
  targetPosition: z.infer<typeof schemas.position>,
  enemySamGroups: z.infer<typeof schemas.campaign.campaignSamGroup>[],
  theatre: z.infer<typeof schemas.theatre>,
  campaign?: Campaign,
  coalition?: Coalition
): ThreateningSam | null {
  const threateningSams = findThreateningSams(
    targetPosition,
    enemySamGroups,
    theatre,
    campaign,
    coalition
  )
  return threateningSams[0] ?? null
}
