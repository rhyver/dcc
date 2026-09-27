import { aircrafts } from '@dcc/data'
import { schemas } from '@dcc/contracts'
import type * as z from 'zod'

type FlightTask = z.infer<typeof schemas.flightGroup>['task']

const aircraftDisplayNames = new Map<string, string>(
  Object.values(aircrafts).map((def) => [def.name, def.display_name])
)

export function getAircraftDisplayName(name: string): string {
  return aircraftDisplayNames.get(name) ?? name
}

export function getTaskAircraftTypeOptions(
  task: FlightTask,
  availableAircraftTypes?: readonly string[]
): string[] {
  const availableAircraft = availableAircraftTypes ? new Set(availableAircraftTypes) : undefined

  return Object.values(aircrafts)
    .filter(
      (aircraft) =>
        aircraft.controllable &&
        aircraft.availableTasks.includes(task) &&
        (!availableAircraft || availableAircraft.has(aircraft.name))
    )
    .sort((a, b) => a.display_name.localeCompare(b.display_name))
    .map((aircraft) => aircraft.name)
}
