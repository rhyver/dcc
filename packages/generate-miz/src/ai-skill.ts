import { schemas } from '@dcc/contracts'
import type * as z from 'zod'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>

// Random is passed through so DCS chooses a skill for each unit at mission start.
export function resolveAiSkill(campaign: Campaign, coalition: Coalition, fallback: string) {
  return coalition === 'opponent' ? (campaign.campaignParams?.enemySkill ?? fallback) : fallback
}
