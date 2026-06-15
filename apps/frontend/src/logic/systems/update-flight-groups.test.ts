import { afterEach, describe, expect, test, vi } from 'vitest'
import { schemas } from '@dcc/contracts'
import type * as z from 'zod'

import { updateFlightGroups } from './update-flight-groups'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type CoalitionData = Campaign['coalitions']['player']
type FlightGroup = CoalitionData['flightGroups'][number]

const campaignTime = new Date('2026-01-01T12:00:00.000Z')

afterEach(() => {
  vi.restoreAllMocks()
})

function createAircraftTypes(): CoalitionData['aircraftTypes'] {
  return Object.fromEntries(
    schemas.task.options.map((task) => [task, [] as string[]])
  ) as CoalitionData['aircraftTypes']
}

function createGroundUnitTypes(): CoalitionData['groundUnitTypes'] {
  return Object.fromEntries(
    schemas.groundUnitType.options.map((type) => [type, [] as string[]])
  ) as CoalitionData['groundUnitTypes']
}

function createCoalition(id: 'player' | 'opponent'): CoalitionData {
  const aircraftTypes = createAircraftTypes()
  aircraftTypes['Strategic Strike'] = ['B-52H']

  return {
    id,
    aircraftTypes,
    groundUnitTypes: createGroundUnitTypes(),
    airdromeNames: ['Home'],
    objectiveIds: [],
    structures: [],
    samGroups: [],
    groundGroups: [],
    flightGroups: [],
    packages: [],
    supplyNodes: {}
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

function createLandedStrategicStrike(): FlightGroup {
  return {
    id: 'strategic-1',
    aircrafts: [1, 2, 3, 4].map((unitNumber) => ({
      id: `strategic-1-aircraft-${unitNumber}`,
      unitName: `Buff-1-${unitNumber}`,
      aircraftName: 'B-52H'
    })),
    task: 'Strategic Strike',
    position: { x: 0, y: 0 },
    homeBase: 'Home',
    callsign: 'Buff-1',
    flightplan: {
      id: 'strategic-1-plan',
      startTime: new Date('2026-01-01T11:00:00.000Z'),
      waypoints: [
        {
          name: 'TakeOff',
          position: { x: 0, y: 0 },
          altitude: 0,
          speed: 150,
          type: 'TakeOff'
        },
        {
          name: 'Landing',
          position: { x: 0, y: 0 },
          altitude: 0,
          speed: 150,
          type: 'Landing'
        }
      ]
    }
  }
}

describe('updateFlightGroups', () => {
  test('starts a 40-90 minute cooldown when a strategic strike lands', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign()
    campaign.coalitions.opponent.flightGroups = [createLandedStrategicStrike()]

    updateFlightGroups(campaign, 'opponent')

    expect(campaign.coalitions.opponent.flightGroups).toHaveLength(0)
    expect(campaign.coalitions.opponent.strategicStrikeCooldownUntil).toEqual(
      new Date('2026-01-01T12:40:00.000Z')
    )
  })
})
