import * as z from 'zod'

import { dcs } from '../dcs'

export const aircraft = z.object({
  id: z.string(),
  unitName: z.string(),
  aircraftName: dcs.aircraftName,
  client: z.boolean().optional(),
  // Added to fill a client slot beyond the planned flight size; removed when the slot is freed
  addedForClient: z.boolean().optional()
})
