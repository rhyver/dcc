import { schemas } from '@dcc/contracts'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'

import { ensurePersistentIadsEwrs } from './iads-network'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Theatre = z.infer<typeof schemas.theatre>

function campaign(): Campaign {
  const coalition = (id: 'player' | 'opponent') => ({
    id,
    aircraftTypes: {} as Campaign['coalitions']['player']['aircraftTypes'],
    groundUnitTypes: {} as Campaign['coalitions']['player']['groundUnitTypes'],
    airdromeNames: [],
    objectiveIds: id === 'opponent' ? ['Alpha', 'Bravo', 'Charlie', 'Delta'] : [],
    structures: [],
    samGroups:
      id === 'opponent'
        ? ([
            { id: 'sam-alpha', type: 'Hawk', objectiveId: 'Alpha' }
          ] as Campaign['coalitions']['player']['samGroups'])
        : [],
    groundGroups: [],
    flightGroups: [],
    packages: []
  })

  return {
    version: 'test',
    id: 'campaign',
    name: 'Campaign',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    time: new Date('2026-01-01T00:00:00Z'),
    timeMultiplier: 1,
    campaignParams: { iads: true },
    logs: [],
    scenarioId: 'scenario',
    coalitions: { player: coalition('player'), opponent: coalition('opponent') }
  }
}

const theatre: Theatre = {
  name: 'Test',
  objectives: [
    { name: 'Alpha', type: 'primary', position: { x: 0, y: 0 } },
    { name: 'Bravo', type: 'primary', position: { x: 50_000, y: 0 } },
    { name: 'Charlie', type: 'primary', position: { x: 100_000, y: 0 } },
    { name: 'Delta', type: 'primary', position: { x: 150_000, y: 0 } }
  ],
  targets: {},
  airdromeDetails: {},
  info: {
    center: { x: 0, y: 0 },
    weather: {
      temperature: { amplitude: 0, mean: 20 },
      cloudCover: { baseCloudCover: 0, seasonEffect: 0 },
      wind: { speed: 0, direction: 0 }
    },
    night: { startHour: 20, endHour: 6 }
  }
}

describe('persistent IADS EWR network', () => {
  test('creates stable campaign entities at separated opponent objectives', () => {
    const state = campaign()

    ensurePersistentIadsEwrs(state, theatre)

    expect(state.coalitions.opponent.ewrGroups).toEqual([
      {
        id: 'iads-ewr-alpha-1',
        type: '55G6 EWR',
        objectiveId: 'Alpha',
        position: { x: 0, y: 0 }
      },
      {
        id: 'iads-ewr-bravo-2',
        type: '55G6 EWR',
        objectiveId: 'Bravo',
        position: { x: 50_000, y: 0 }
      },
      {
        id: 'iads-ewr-charlie-3',
        type: '55G6 EWR',
        objectiveId: 'Charlie',
        position: { x: 100_000, y: 0 }
      }
    ])
  })

  test('does not recreate an authoritative destroyed network', () => {
    const state = campaign()
    state.coalitions.opponent.ewrGroups = []

    ensurePersistentIadsEwrs(state, theatre)

    expect(state.coalitions.opponent.ewrGroups).toEqual([])
  })
})
