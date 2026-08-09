import * as z from 'zod'

import { groundUnitName } from './ground-unit-name'

export const samType = z.enum(['SA-10-300', 'SA-6', 'SA-5', 'SA-3', 'SA-2', 'Hawk', 'Roland'])
export type SamType = z.infer<typeof samType>

export const samTemplate = z.object({
  units: z.array(groundUnitName),
  range: z.number(),
  fireInterval: z.number()
})
