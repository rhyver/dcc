import * as z from 'zod'

import { position } from './position'
import { unitPosition } from './unit-position'

export const targetType = z.enum(['Vehicle', 'AAA', 'Artillery', 'SAM', 'Structure', 'Farp', 'EW'])

export const target = z.object({
  name: z.string(),
  position,
  blueGroup: z
    .object({
      name: z.string(),
      position,
      objectiveName: z.string(),
      groupId: z.number(),
      unitPositions: z.array(unitPosition)
    })
    .optional(), // TODO
  objectiveName: z.string(),
  groupId: z.number(),
  type: targetType,
  structureType: z.string().optional(),
  structureCategory: z.string().optional(),
  unitPositions: z.array(unitPosition)
})
