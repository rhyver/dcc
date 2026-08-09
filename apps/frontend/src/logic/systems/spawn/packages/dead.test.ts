import { schemas } from '@dcc/contracts'
import type * as z from 'zod'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { spawnDead } from './dead'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type CoalitionData = Campaign['coalitions']['player']

const campaignTime = new Date('2026-01-01T12:00:00.000Z')

afterEach(() => {
  vi.restoreAllMocks()
})

function createCoalition(id: 'player' | 'opponent'): CoalitionData {
  const aircraftTypes = Object.fromEntries(
    schemas.task.options.map((task) => [task, [] as string[]])
  ) as CoalitionData['aircraftTypes']
  aircraftTypes.DEAD = id === 'player' ? ['FA-18C_hornet'] : []

  return {
    id,
    aircraftTypes,
    groundUnitTypes: Object.fromEntries(
      schemas.groundUnitType.options.map((type) => [type, [] as string[]])
    ) as CoalitionData['groundUnitTypes'],
    airdromeNames: id === 'player' ? ['Kobuleti'] : ['Sukhumi-Babushara'],
    objectiveIds: [],
    structures: [],
    samGroups:
      id === 'opponent'
        ? [
            { id: 'far-sam', type: 'SA-6', objectiveId: 'Gali' },
            { id: 'near-sam', type: 'SA-6', objectiveId: 'Zugdidi' }
          ]
        : [],
    groundGroups: [],
    flightGroups: [],
    packages: [],
    supplyNodes:
      id === 'player'
        ? {
            Kobuleti: {
              current: 10_000,
              max: 10_000,
              productionRate: 0,
              consumptionRate: 0,
              status: 'abundant'
            }
          }
        : {}
  }
}

function createCampaign(): Campaign {
  return {
    version: 'test',
    id: 'campaign-1',
    name: 'Test Campaign',
    createdAt: campaignTime,
    updatedAt: campaignTime,
    time: campaignTime,
    timeMultiplier: 1,
    logs: [],
    scenarioId: 'red-bullet',
    coalitions: {
      player: createCoalition('player'),
      opponent: createCoalition('opponent')
    }
  }
}

describe('spawnDead', () => {
  test('targets the nearest available SAM first', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign()

    spawnDead(campaign, 'player')

    expect(campaign.coalitions.player.flightGroups).toHaveLength(1)
    expect(campaign.coalitions.player.flightGroups[0]?.target?.id).toBe('near-sam')
  })
})
