import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const STARTUP_DELAY_MS = 10 * 60 * 1000

export function hasFlightGroupTakenOff(
  group: z.infer<typeof schemas.flightGroup>,
  currentTime: Date
): boolean {
  const startTime = new Date(group.flightplan.startTime)
  return currentTime.getTime() >= startTime.getTime() + STARTUP_DELAY_MS
}
