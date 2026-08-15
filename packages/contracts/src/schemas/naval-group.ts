import * as z from 'zod'

import { position } from './position'

export const navalGroup = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['carrier', 'escort', 'transport', 'surface-combatant']),
  missionGroupId: z.string().optional(),
  unitTypes: z.array(z.string()).min(1),
  units: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        damage: z.number().min(0).max(1).default(0),
        ammunition: z.number().min(0).max(1).default(1),
        fuel: z.number().min(0).max(1).default(1),
        state: z.enum(['operational', 'damaged', 'sunk']).default('operational')
      })
    )
    .optional(),
  position,
  heading: z.number(),
  damage: z.number().min(0).max(1).default(0),
  fuel: z.number().min(0).max(1).default(1),
  ammunition: z.number().min(0).max(1).default(1),
  cargo: z.number().nonnegative().default(0),
  state: z.enum(['operational', 'damaged', 'sunk', 'unloading']).default('operational')
})
