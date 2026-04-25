import * as z from 'zod'

import { position } from './position'

export const groundGroup = z.object({
  id: z.string(),
  objectiveId: z.string().optional(),
  targetObjectiveId: z.string().optional(),
  targetAirdromeName: z.string().optional(),
  position: position,
  state: z.enum(['idle', 'moving', 'combat']).default('idle'),
  combatStartedAt: z.string().optional(),
  captureStartedAt: z.string().optional(),
  initialStrength: z.number().optional(),
  units: z.array(
    z.object({
      name: z.string(),
      count: z.number()
    })
  )
})
