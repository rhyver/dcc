import * as z from 'zod'

import { aircraft } from './aircraft'
import { position } from './position'
import { task } from './task'

export const flightGroup = z.object({
  id: z.string(),
  aircrafts: z.array(aircraft),
  task,
  position,
  homeBase: z.string()
})
