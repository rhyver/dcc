import * as z from 'zod'

import { era } from './era'
import { groundUnitType } from './ground-unit-type'

export const template = z.object({
  name: z.string(),
  countryName: z.string(),
  era,
  groundUnitTypes: z.record(groundUnitType, z.array(z.string()))
})
