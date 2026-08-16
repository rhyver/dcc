import { scenarios, theatres } from '@dcc/data'
import { describe, expect, test } from 'vitest'

import { assignStructures } from './assign-structures'

describe('scenario-required structures', () => {
  test('guarantees Eagle Down a Blue FARP at the Bunji-ye-Maski foothold', () => {
    const scenario = scenarios.find((candidate) => candidate.id === 'eagle-down')!
    const theatre = theatres.find((candidate) => candidate.name === 'PersianGulf')!
    const objective = theatre.objectives.find((candidate) => candidate.name === 'Bunji-ye-Maski')!
    const target = theatre.targets['Bunji-ye-Maski']!.find(
      (candidate) => candidate.name === 'Bunji-ye-Maski|Structure|2'
    )!

    const assignments = assignStructures(
      [
        {
          id: objective.name,
          position: objective.position,
          targets: theatre.targets[objective.name] ?? []
        }
      ],
      [],
      { requiredStructures: scenario.start.player.structureAssignments }
    )

    const farp = assignments.find(
      (assignment) => assignment.objectiveId === objective.name && assignment.type === 'Farp'
    )

    expect(farp).toMatchObject({
      name: target.name,
      position: target.position,
      type: 'Farp'
    })
    expect(farp?.buildings.some((building) => building.type === 'FARP')).toBe(true)
  })
})
