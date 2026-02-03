import { schemas } from '@dcc/contracts'
import { samTemplates } from '@dcc/data'
import * as z from 'zod'
import { calculateDistance } from './calculate-distance'
import { getObjectivePosition } from './get-objective-position'

export type ThreateningSam = {
  samGroup: z.infer<typeof schemas.campaign.campaignSamGroup>
  position: z.infer<typeof schemas.position>
  range: number
  distance: number
}

export function findThreateningSams(
  targetPosition: z.infer<typeof schemas.position>,
  enemySamGroups: z.infer<typeof schemas.campaign.campaignSamGroup>[],
  theatre: z.infer<typeof schemas.theatre>
): ThreateningSam[] {
  const threateningSams: ThreateningSam[] = []

  for (const samGroup of enemySamGroups) {
    // Skip destroyed or suppressed SAMs
    if (samGroup.destroyed || samGroup.suppressed) {
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

    const distance = calculateDistance(targetPosition, samPosition)

    // Check if target is within SAM engagement range
    if (distance <= samTemplate.range) {
      threateningSams.push({
        samGroup,
        position: samPosition,
        range: samTemplate.range,
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
  theatre: z.infer<typeof schemas.theatre>
): ThreateningSam | null {
  const threateningSams = findThreateningSams(targetPosition, enemySamGroups, theatre)
  return threateningSams[0] ?? null
}
