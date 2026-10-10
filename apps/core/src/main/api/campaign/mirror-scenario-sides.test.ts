import { schemas } from '@dcc/contracts'
import { describe, expect, test } from 'vitest'
import type * as z from 'zod'

import { mirrorScenarioSides } from './mirror-scenario-sides'

type Scenario = z.infer<typeof schemas.scenario>

const scenario: Scenario = {
  theatreName: 'Caucasus',
  id: 'two-sided',
  name: 'Two-Sided Test',
  available: true,
  era: 'Late CW',
  sideSelectable: true,
  defaultFactionIds: { player: 'blue-faction', opponent: 'red-faction' },
  date: new Date('1985-06-01T09:00:00Z'),
  briefing: 'Blue briefing',
  opponentBriefing: 'Red briefing',
  navalGroups: { player: [], opponent: [] },
  goal: { coalition: 'player', objectiveIds: ['Red Capital'] },
  opponentGoal: { coalition: 'player', objectiveIds: ['Blue Capital'] },
  start: {
    player: { airdromeNames: ['Blue Base'], objectiveIds: ['Blue Capital'] },
    opponent: { airdromeNames: ['Red Base'], objectiveIds: ['Red Capital'] }
  }
}

describe('mirrorScenarioSides', () => {
  const red = mirrorScenarioSides(scenario)

  test('gives the player the opponent territory and bases', () => {
    expect(red.start.player).toBe(scenario.start.opponent)
    expect(red.start.opponent).toBe(scenario.start.player)
  })

  test('swaps the default factions and naval groups', () => {
    expect(red.defaultFactionIds).toEqual({ player: 'red-faction', opponent: 'blue-faction' })
    expect(red.navalGroups?.player).toBe(scenario.navalGroups?.opponent)
    expect(red.navalGroups?.opponent).toBe(scenario.navalGroups?.player)
  })

  test('uses the red side goal and briefing', () => {
    expect(red.goal).toEqual({ coalition: 'player', objectiveIds: ['Blue Capital'] })
    expect(red.opponentGoal).toBeUndefined()
    expect(red.briefing).toBe('Red briefing')
  })

  test('falls back to a mirrored defeat condition when the scenario has no red goal', () => {
    const mirrored = mirrorScenarioSides({
      ...scenario,
      opponentGoal: undefined,
      opponentBriefing: undefined
    })
    expect(mirrored.goal).toEqual({ coalition: 'opponent', objectiveIds: ['Red Capital'] })
    expect(mirrored.briefing).toBe('Blue briefing')
  })
})
