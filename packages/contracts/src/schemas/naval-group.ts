import * as z from 'zod'

import { position } from './position'

const tacan = z.object({
  channel: z.number().int().min(1).max(126),
  band: z.literal('X').default('X'),
  callsign: z.string().min(1).max(4)
})

export const navalGroup = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['carrier', 'escort', 'transport', 'surface-combatant']),
  missionGroupId: z.string().optional(),
  missionPatrol: z
    .object({
      pattern: z.literal('circle'),
      radius: z.number().positive(),
      speed: z.number().positive()
    })
    .optional(),
  persistPosition: z.boolean().optional(),
  unitTypes: z.array(z.string()).min(1),
  units: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        damage: z.number().min(0).max(1).default(0),
        ammunition: z.number().min(0).max(1).default(1),
        fuel: z.number().min(0).max(1).default(1),
        tacan: tacan.optional(),
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
  tacan: tacan.optional(),
  state: z.enum(['operational', 'damaged', 'sunk', 'unloading']).default('operational')
})
