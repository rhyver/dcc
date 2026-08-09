import * as z from 'zod'

import { position } from './position'

export const groundGroup = z.object({
  id: z.string(),
  objectiveId: z.string().optional(),
  targetObjectiveId: z.string().optional(),
  targetAirdromeName: z.string().optional(),
  position: position,
  state: z
    .enum(['idle', 'moving', 'combat', 'withdrawing', 'awaiting-extraction', 'trapped'])
    .default('idle'),
  combatStartedAt: z.string().optional(),
  captureStartedAt: z.string().optional(),
  initialStrength: z.number().optional(),
  baselineCombatPower: z.number().positive().optional(),
  authorizedTemplateId: z.string().optional(),
  deploymentDeferredReason: z.string().optional(),
  deployment: z
    .object({
      siteId: z.string(),
      assignedAt: z.string(),
      reason: z.enum(['creation', 'arrival', 'capture', 'retreat', 'landing', 'redeployment'])
    })
    .optional(),
  retreat: z
    .object({
      destinationObjectiveId: z.string().optional(),
      route: z.array(position).default([]),
      startedAt: z.string(),
      surrenderAt: z.string().optional(),
      extractionRequestId: z.string().optional(),
      retryAfter: z.string().optional()
    })
    .optional(),
  units: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      count: z.number(),
      position: position.optional(),
      heading: z.number().optional(),
      slotId: z.string().optional(),
      condition: z.enum(['operational', 'damaged']).default('operational').optional()
    })
  )
})
