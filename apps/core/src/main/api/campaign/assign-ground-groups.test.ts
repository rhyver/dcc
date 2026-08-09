import { templates } from '@dcc/data'
import { describe, expect, test } from 'vitest'

import { assignGroundGroups } from './assign-ground-groups'

const template = templates.find((candidate) => candidate.name === 'Argentina - Falklands 1982')!
const objectives = ['Port Stanley', 'Goose Green', 'Fox Bay'].map((id, index) => ({
  id,
  position: { x: index * 50_000, y: 0 },
  targets: [
    {
      name: `${id}|Vehicle|1`,
      type: 'Vehicle',
      position: { x: index * 50_000 + 500, y: 500 }
    }
  ]
}))

describe('assignGroundGroups', () => {
  test('can seed defensive garrisons without an existing enemy land objective', () => {
    expect(
      assignGroundGroups({
        coalitionObjectives: objectives,
        enemyObjectives: [],
        template
      })
    ).toEqual([])

    const assignments = assignGroundGroups({
      coalitionObjectives: objectives,
      enemyObjectives: [],
      template,
      defendAllObjectives: true
    })

    expect(assignments).toHaveLength(objectives.length)
    expect(assignments.map((assignment) => assignment.objectiveId)).toEqual(
      objectives.map((objective) => objective.id)
    )
  })
})
