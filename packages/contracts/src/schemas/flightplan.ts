import * as z from 'zod'

import { position } from './position'

export const waypointType = z.enum(['TakeOff', 'Landing', 'Task', 'Nav', 'Hold', 'RaceTrack End'])

export const waypoint = z.object({
  name: z.string(),
  position,
  altitude: z.number(),
  speed: z.number(),
  type: waypointType
})

export const flightplan = z.object({
  id: z.string(),
  startTime: z.date(),
  originalStartTime: z.date().optional(),
  waypoints: z.array(waypoint)
})
