import * as z from 'zod'

import { aircraft } from './aircraft'
import { flightplan } from './flightplan'
import { position } from './position'
import { task } from './task'

const structureTarget = z.object({
  id: z.string(),
  type: z.string(),
  objectiveId: z.string()
})

export const flightGroup = z.object({
  id: z.string(),
  aircrafts: z.array(aircraft),
  task,
  position,
  homeBase: z.string(),
  callsign: z.string(),
  target: structureTarget.optional(),
  targetDestroyed: z.boolean().optional(),
  tot: z.date().optional(),
  flightplan: flightplan,
  packageId: z.string().optional()
})
