import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { logCampaignAction } from '@/logic/simulation-log'

type Campaign = z.infer<typeof schemas.campaign.campaign>

export function updateCampaignGoal(draft: Campaign): void {
  if ((draft.status ?? 'active') !== 'active' || !draft.goal) return

  const coalition = draft.goal.coalition
  const controlledObjectiveIds = new Set(draft.coalitions[coalition].objectiveIds)
  const hasReachedGoal = draft.goal.objectiveIds.every((objectiveId) =>
    controlledObjectiveIds.has(objectiveId)
  )

  if (!hasReachedGoal) return

  draft.status = coalition === 'player' ? 'won' : 'lost'
  draft.timeMultiplier = 0
  logCampaignAction(
    draft,
    coalition,
    `Campaign ${draft.status}: ${coalition} controls ${draft.goal.objectiveIds.join(', ')}`
  )
}
