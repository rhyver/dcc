import { describe, expect, test } from 'vitest'
import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { getFlightGroupsByTask, sortFlightGroupsByStartTime } from './flight-group-task-groups'

type FlightGroup = z.infer<typeof schemas.flightGroup>

function createFlightGroup(
  id: string,
  callsign: string,
  task: FlightGroup['task'],
  startTime: string
): FlightGroup {
  return {
    id,
    callsign,
    task,
    homeBase: 'Kutaisi',
    aircrafts: [
      {
        id: `${id}-1`,
        aircraftName: 'F-16C_50',
        unitName: `${callsign}-1`,
        client: false
      }
    ],
    flightplan: {
      id: `${id}-plan`,
      startTime: new Date(startTime),
      waypoints: []
    },
    position: { x: 0, y: 0 }
  }
}

describe('flight group task groups', () => {
  test('sorts flight groups by start time before callsign', () => {
    const groups = [
      createFlightGroup('late', 'Bravo-1', 'CAP', '2026-01-01T12:30:00.000Z'),
      createFlightGroup('early-b', 'Charlie-1', 'CAS', '2026-01-01T12:05:00.000Z'),
      createFlightGroup('early-a', 'Alpha-1', 'SEAD', '2026-01-01T12:05:00.000Z')
    ]

    expect(sortFlightGroupsByStartTime(groups).map((group) => group.id)).toEqual([
      'early-a',
      'early-b',
      'late'
    ])
  })

  test('keeps each task bucket in start-time order', () => {
    const groups = [
      createFlightGroup('late-cap', 'Bravo-1', 'CAP', '2026-01-01T12:30:00.000Z'),
      createFlightGroup('early-cap', 'Alpha-1', 'CAP', '2026-01-01T12:05:00.000Z')
    ]

    expect(
      getFlightGroupsByTask(groups)
        .get('CAP')
        ?.map((group) => group.id)
    ).toEqual(['early-cap', 'late-cap'])
  })
})
