import { describe, expect, test } from 'vitest'

import { selectHomeBaseAndTarget, type AirdromeSelection } from './common'

const homeBases: AirdromeSelection[] = [
  {
    name: 'Near',
    position: { x: 0, y: 0 }
  },
  {
    name: 'Far',
    position: { x: 100_000, y: 0 }
  }
]

const targets = [
  {
    target: { id: 'target-1' },
    position: { x: 10_000, y: 0 }
  }
]

describe('home base and target selection', () => {
  test('selects the nearest valid home base and target pair', () => {
    const assignment = selectHomeBaseAndTarget({
      homeBases,
      targets: [
        ...targets,
        {
          target: { id: 'target-2' },
          position: { x: 101_000, y: 0 }
        }
      ],
      maxDistance: 120_000,
      preference: 'nearest'
    })

    expect(assignment?.homeBase.name).toBe('Far')
    expect(assignment?.target.id).toBe('target-2')
  })

  test('can prefer the furthest valid home base', () => {
    const assignment = selectHomeBaseAndTarget({
      homeBases,
      targets,
      maxDistance: 120_000,
      preference: 'farthest'
    })

    expect(assignment?.homeBase.name).toBe('Far')
  })

  test('ignores furthest home bases outside maximum range', () => {
    const assignment = selectHomeBaseAndTarget({
      homeBases,
      targets,
      maxDistance: 50_000,
      preference: 'farthest'
    })

    expect(assignment?.homeBase.name).toBe('Near')
  })
})
