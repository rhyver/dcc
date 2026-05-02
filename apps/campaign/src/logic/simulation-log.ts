import { schemas } from '@dcc/contracts'
import * as z from 'zod'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type LogEntityRef = {
  entityType: 'flightGroup' | 'groundGroup'
  entityId: string
}
const MAX_LOG_ENTRIES = 500

function appendLog(
  draft: Campaign,
  type: 'spawn' | 'combat' | 'campaign',
  coalition: Coalition,
  message: string,
  label?: string,
  entityRef?: LogEntityRef
): void {
  const entry = {
    id: crypto.randomUUID(),
    type,
    coalition,
    label,
    entityType: entityRef?.entityType,
    entityId: entityRef?.entityId,
    campaignTime: draft.time.toISOString(),
    message,
    createdAt: new Date().toISOString()
  }
  draft.logs.push(entry)
  globalThis.window?.api?.logActionEntry(entry)
  if (draft.logs.length > MAX_LOG_ENTRIES) {
    draft.logs.splice(0, draft.logs.length - MAX_LOG_ENTRIES)
  }
}

export function logSpawnAction(
  draft: Campaign,
  coalition: Coalition,
  message: string,
  label?: string,
  entityRef?: LogEntityRef
): void {
  appendLog(draft, 'spawn', coalition, message, label, entityRef)
}

export function logCombatAction(
  draft: Campaign,
  coalition: Coalition,
  message: string,
  label?: string,
  entityRef?: LogEntityRef
): void {
  appendLog(draft, 'combat', coalition, message, label, entityRef)
}

export function logCampaignAction(draft: Campaign, coalition: Coalition, message: string): void {
  appendLog(draft, 'campaign', coalition, message)
}
