import { describe, expect, test } from 'vitest'

import { selectCapPatrolAssignment, type AirdromeSelection } from './common'

const homeBase: AirdromeSelection = {
  name: 'player-base',
  position: { x: 0, y: 0 }
}

const enemyBase: AirdromeSelection = {
  name: 'enemy-base',
  position: { x: 100_000, y: 0 }
}

describe('selectCapPatrolAssignment', () => {
  test('does not assign a second patrol from the same home base when it is already covered', () => {
    const first = selectCapPatrolAssignment({
      homeBases: [homeBase],
      enemyAirdromes: [enemyBase],
      coveredHomeBases: new Set(),
      maxHomeToEnemyDistance: 500_000
    })

    expect(first).not.toBeNull()

    const second = selectCapPatrolAssignment({
      homeBases: [homeBase],
      enemyAirdromes: [enemyBase],
      coveredHomeBases: new Set([homeBase.name]),
      maxHomeToEnemyDistance: 500_000
    })

    expect(second).toBeNull()
  })

  test('can assign a stacked patrol from a covered home base when explicitly allowed', () => {
    const first = selectCapPatrolAssignment({
      homeBases: [homeBase],
      enemyAirdromes: [enemyBase],
      coveredHomeBases: new Set(),
      maxHomeToEnemyDistance: 500_000
    })

    const manual = selectCapPatrolAssignment({
      homeBases: [homeBase],
      enemyAirdromes: [enemyBase],
      coveredHomeBases: new Set([homeBase.name]),
      maxHomeToEnemyDistance: 500_000,
      allowCoveredHomeBases: true,
      capPatrolCountByHomeBase: new Map([[homeBase.name, 1]])
    })

    expect(manual).not.toBeNull()
    expect(manual?.homeBase.name).toBe(homeBase.name)
    expect(manual?.patrolCenter).not.toEqual(first?.patrolCenter)
  })
})
