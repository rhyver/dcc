import { schemas } from '@dcc/contracts'
import { isSamFullyDestroyed, isSamOperational } from '@dcc/data'
import * as z from 'zod'

import { getObjectivePosition } from '@/logic/utils/get-objective-position'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type Theatre = z.infer<typeof schemas.theatre>

export const EWR_ATTACK_RANGE_METERS = 100_000

export type IadsEmitterTarget = {
  target: {
    id: string
    type: string
    objectiveId: string
  }
  position: z.infer<typeof schemas.position>
  operational: boolean
}

export function getIadsEmitterTargets(
  campaign: Campaign,
  coalition: Coalition,
  theatre: Theatre,
  task: 'SEAD' | 'DEAD'
): IadsEmitterTarget[] {
  const coalitionData = campaign.coalitions[coalition]
  const samTargets = coalitionData.samGroups.flatMap((sam) => {
    const eligible = task === 'DEAD' ? !isSamFullyDestroyed(sam) : isSamOperational(sam)
    if (!eligible) return []
    const position = getObjectivePosition(theatre, sam.objectiveId)
    if (!position) return []
    return [
      {
        target: { id: sam.id, type: sam.type, objectiveId: sam.objectiveId },
        position,
        operational: isSamOperational(sam)
      }
    ]
  })
  const ewrTargets = (coalitionData.ewrGroups ?? []).flatMap((ewr) => {
    const operational = !ewr.destroyed && !ewr.suppressed
    const eligible = task === 'DEAD' ? !ewr.destroyed : operational
    if (!eligible) return []
    return [
      {
        target: { id: ewr.id, type: ewr.type, objectiveId: ewr.objectiveId },
        position: ewr.position,
        operational
      }
    ]
  })

  return [...samTargets, ...ewrTargets]
}
