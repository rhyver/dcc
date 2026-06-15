import { afterEach, describe, expect, test, vi } from 'vitest'
import { schemas } from '@dcc/contracts'
import type * as z from 'zod'

import { spawnStrategicStrike } from './strike'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type CoalitionData = Campaign['coalitions']['player']

const campaignTime = new Date('2026-01-01T12:00:00.000Z')

afterEach(() => {
  vi.restoreAllMocks()
})

function createAircraftTypes(): CoalitionData['aircraftTypes'] {
  const aircraftTypes = Object.fromEntries(
    schemas.task.options.map((task) => [task, [] as string[]])
  ) as CoalitionData['aircraftTypes']

  aircraftTypes['Strategic Strike'] = ['Tu-95MS']
  aircraftTypes.SEAD = []
  return aircraftTypes
}

function createGroundUnitTypes(): CoalitionData['groundUnitTypes'] {
  return Object.fromEntries(
    schemas.groundUnitType.options.map((type) => [type, [] as string[]])
  ) as CoalitionData['groundUnitTypes']
}

function createCoalition(id: 'player' | 'opponent'): CoalitionData {
  return {
    id,
    aircraftTypes: createAircraftTypes(),
    groundUnitTypes: createGroundUnitTypes(),
    airdromeNames: id === 'opponent' ? ['Sukhumi-Babushara'] : ['Kobuleti'],
    objectiveIds: id === 'opponent' ? ['Sukhumi-Babushara'] : ['Enguri Dam'],
    structures:
      id === 'player'
        ? [
            {
              id: 'structure-1',
              type: 'Ammo Depot',
              objectiveId: 'Enguri Dam',
              position: { x: -215_800, y: 604_300 },
              name: 'Ammo Depot',
              resources: 100,
              buildings: [{ offset: { x: 0, y: 0 }, type: 'Workshop A', alive: true }]
            }
          ]
        : [],
    samGroups: [],
    groundGroups: [],
    flightGroups: [],
    packages: [],
    supplyNodes: {
      'Sukhumi-Babushara': {
        current: 10_000,
        max: 10_000,
        productionRate: 0,
        consumptionRate: 0,
        status: 'abundant'
      }
    }
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

describe('spawnStrategicStrike', () => {
  test('waits for the initial strategic strike cooldown before spawning', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign()
    campaign.coalitions.opponent.strategicStrikeCooldownUntil = new Date('2026-01-01T12:40:00.000Z')

    spawnStrategicStrike(campaign, 'opponent')

    expect(campaign.coalitions.opponent.flightGroups).toHaveLength(0)

    campaign.time = new Date('2026-01-01T12:41:00.000Z')
    spawnStrategicStrike(campaign, 'opponent')

    expect(campaign.coalitions.opponent.strategicStrikeCooldownUntil).toBeUndefined()
    expect(campaign.coalitions.opponent.flightGroups).toHaveLength(1)
    expect(campaign.coalitions.opponent.flightGroups[0]?.task).toBe('Strategic Strike')
  })
})
