import * as z from 'zod'

import { position } from './position'
import { supply } from './supply'

export const airdromeStand = position.extend({
  id: z.string(),
  crossroad_index: z.number(),
  helicopter: z.boolean(),
  large: z.boolean(),
  plane: z.boolean(),
  shelter: z.boolean(),
  blocked: z.boolean().optional()
})

export const airdromeDetails = position.extend({
  id: z.number(),
  name: z.string(),
  standlist: z.record(z.string(), airdromeStand),
  frequency: z.number().optional(),
  frequencyList: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(), // TODO
  tacan: z
    .object({
      channel: z.number(),
      band: z.enum(['X', 'Y']).optional(),
      callsign: z.string().optional()
    })
    .optional(),
  runwayAngle: z.number(),
  supply: supply.optional()
})
