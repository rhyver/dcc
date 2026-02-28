import { schemas } from '@dcc/contracts'
import * as z from 'zod'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
const MAX_LOG_ENTRIES = 500

function appendLog(
  draft: Campaign,
  type: 'spawn' | 'combat',
  coalition: Coalition,
  message: string,
  label?: string
): void {
  draft.logs.push({
    id: crypto.randomUUID(),
    type,
    coalition,
    label,
    campaignTime: draft.time.toISOString(),
    message,
    createdAt: new Date().toISOString()
  })
  if (draft.logs.length > MAX_LOG_ENTRIES) {
    draft.logs.splice(0, draft.logs.length - MAX_LOG_ENTRIES)
  }
}

export function logSpawnAction(
  draft: Campaign,
  coalition: Coalition,
  message: string,
  label?: string
): void {
  appendLog(draft, 'spawn', coalition, message, label)
}

export function logCombatAction(
  draft: Campaign,
  coalition: Coalition,
  message: string,
  label?: string
): void {
  appendLog(draft, 'combat', coalition, message, label)
}
