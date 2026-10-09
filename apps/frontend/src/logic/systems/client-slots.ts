import { schemas } from '@dcc/contracts'
import * as z from 'zod'

type FlightGroup = z.infer<typeof schemas.flightGroup>

// Client flights may grow beyond the planned size up to this many aircraft
export const MAX_CLIENT_FLIGHT_SIZE = 4

export function getAvailableClientSlots(group: FlightGroup) {
  return Math.max(group.aircrafts.length, MAX_CLIENT_FLIGHT_SIZE)
}

export function removeUnusedClientAircraft(group: FlightGroup) {
  group.aircrafts = group.aircrafts.filter(
    (aircraft) => aircraft.client || !aircraft.addedForClient
  )
}

export function applyFlightGroupClientCount(group: FlightGroup, requestedCount: number) {
  const count = Math.max(0, Math.min(requestedCount, getAvailableClientSlots(group)))
  const template = group.aircrafts[0]

  if (template) {
    while (group.aircrafts.length < count) {
      group.aircrafts.push({
        id: crypto.randomUUID(),
        unitName: `${template.aircraftName} ${group.aircrafts.length + 1}`,
        aircraftName: template.aircraftName,
        addedForClient: true
      })
    }
  }

  group.aircrafts.forEach((aircraft, index) => {
    aircraft.client = index < count
  })
  removeUnusedClientAircraft(group)
}
