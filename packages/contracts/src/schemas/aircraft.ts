import * as z from 'zod'

import { dcs } from '../dcs'

export const aircraft = z.object({
  id: z.string(),
  unitName: z.string(),
  aircraftName: dcs.aircraftName,
  client: z.boolean().optional()
})
