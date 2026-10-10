import { schemas } from '@dcc/contracts'
import { describe, expect, test, vi } from 'vitest'
import type * as z from 'zod'

import { updateCampaignGoal } from './campaign-goal'

type Campaign = z.infer<typeof schemas.campaign.campaign>

vi.mock('@dcc/data', async (importOriginal) => {
  const original = await importOriginal<typeof import('@dcc/data')>()
  return {
    ...original,
    scenarios: [
      {
        id: 'race',
        goal: { coalition: 'player', objectiveIds: ['Red Capital'] },
        opponentGoal: { coalition: 'player', objectiveIds: ['Blue Capital'] }
      }
    ]
  }
})

function createCampaign(params: {
  playerSide?: Campaign['playerSide']
  goalObjectiveIds: string[]
  playerObjectiveIds: string[]
  opponentObjectiveIds: string[]
}): Campaign {
  const coalition = (id: 'player' | 'opponent', objectiveIds: string[]) =>
    ({ id, objectiveIds }) as unknown as Campaign['coalitions']['player']
  return {
    scenarioId: 'race',
    playerSide: params.playerSide,
    status: 'active',
    timeMultiplier: 60,
    time: new Date('1985-06-01T09:00:00Z'),
    logs: [],
    goal: { coalition: 'player', objectiveIds: params.goalObjectiveIds },
    coalitions: {
      player: coalition('player', params.playerObjectiveIds),
      opponent: coalition('opponent', params.opponentObjectiveIds)
    }
  } as unknown as Campaign
}

describe('updateCampaignGoal', () => {
  test('wins when the player takes its goal', () => {
    const campaign = createCampaign({
      goalObjectiveIds: ['Red Capital'],
      playerObjectiveIds: ['Blue Capital', 'Red Capital'],
      opponentObjectiveIds: []
    })

    updateCampaignGoal(campaign)

    expect(campaign.status).toBe('won')
    expect(campaign.timeMultiplier).toBe(0)
  })

  test('loses on blue when the opponent takes its race goal', () => {
    const campaign = createCampaign({
      goalObjectiveIds: ['Red Capital'],
      playerObjectiveIds: [],
      opponentObjectiveIds: ['Red Capital', 'Blue Capital']
    })

    updateCampaignGoal(campaign)

    expect(campaign.status).toBe('lost')
  })

  test('loses on red when the AI takes the scenario blue goal', () => {
    const campaign = createCampaign({
      playerSide: 'red',
      goalObjectiveIds: ['Blue Capital'],
      playerObjectiveIds: [],
      opponentObjectiveIds: ['Red Capital']
    })

    updateCampaignGoal(campaign)

    expect(campaign.status).toBe('lost')
  })

  test('stays active while neither side holds its goal', () => {
    const campaign = createCampaign({
      playerSide: 'red',
      goalObjectiveIds: ['Blue Capital'],
      playerObjectiveIds: ['Red Capital'],
      opponentObjectiveIds: ['Blue Capital']
    })

    updateCampaignGoal(campaign)

    expect(campaign.status).toBe('active')
  })
})
