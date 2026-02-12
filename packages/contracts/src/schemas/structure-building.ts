import * as z from 'zod'

import { buildingType } from './building-type'
import { position } from './position'

export const structureBuilding = z.object({
  offset: position,
  type: buildingType,
  alive: z.boolean().default(true)
})
