import { aircrafts } from '@dcc/data'

const aircraftDisplayNames = new Map<string, string>(
  Object.values(aircrafts).map((def) => [def.name, def.display_name])
)

export function getAircraftDisplayName(name: string): string {
  return aircraftDisplayNames.get(name) ?? name
}
