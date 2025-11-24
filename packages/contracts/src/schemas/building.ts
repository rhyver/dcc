import * as z from 'zod'

import { buildingType } from './building-type'

export const building = z.object({
  category: z.string(),
  shapeName: z.string().optional(),
  type: buildingType
})
