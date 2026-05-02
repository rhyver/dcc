import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { featureFlags } from '@/lib/feature-flags'

type FlightGroup = z.infer<typeof schemas.flightGroup>

export function getFlightGroupsByTask(flightGroups: FlightGroup[]) {
  const groupsByTask = new Map<string, FlightGroup[]>()

  for (const group of flightGroups) {
    if (!featureFlags.transportFlightGroups && group.task === 'Transport') continue
    if (group.aircrafts.length === 0) continue

    const existing = groupsByTask.get(group.task)
    if (existing) {
      existing.push(group)
    } else {
      groupsByTask.set(group.task, [group])
    }
  }

  return groupsByTask
}

export function getSortedFlightGroupTasks(groupsByTask: Map<string, FlightGroup[]>) {
  return Array.from(groupsByTask.keys()).sort()
}
