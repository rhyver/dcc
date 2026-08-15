import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { tryDcsPositionToLngLat } from '@/logic/dcs-coordinates'

type EwrGroup = z.infer<typeof schemas.campaign.campaignEwrGroup>

export function createEwrMapItems(
  groups: EwrGroup[],
  coalition: z.infer<typeof schemas.coalition>,
  theatreName: string
): z.infer<typeof schemas.EwrMapItem>[] {
  return groups.flatMap((group) => {
    const position = tryDcsPositionToLngLat(theatreName, group.position.x, group.position.y)
    if (!position) return []

    return [
      {
        id: group.id,
        type: 'EWR' as const,
        objectiveId: group.objectiveId,
        name: group.type,
        coalition,
        position,
        active: group.destroyed !== true && group.suppressed !== true
      }
    ]
  })
}
