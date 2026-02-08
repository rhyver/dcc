import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { aircrafts } from '@dcc/data'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const aircraftDisplayNames = new Map<string, string>(
  Object.values(aircrafts).map((def) => [def.name, def.display_name])
)

export function getAircraftDisplayName(name: string): string {
  return aircraftDisplayNames.get(name) ?? name
}
