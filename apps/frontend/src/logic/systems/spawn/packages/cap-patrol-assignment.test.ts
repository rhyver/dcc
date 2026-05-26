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
  test('assigns a second patrol from the same home base when it is already covered', () => {
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
      maxHomeToEnemyDistance: 500_000,
      capPatrolCountByHomeBase: new Map([[homeBase.name, 1]])
    })

    expect(second).not.toBeNull()
    expect(second?.homeBase.name).toBe(homeBase.name)
    expect(second?.patrolCenter).not.toEqual(first?.patrolCenter)
  })
})
