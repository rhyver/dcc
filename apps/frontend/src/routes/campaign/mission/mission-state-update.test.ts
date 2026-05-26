import { describe, expect, test } from 'vitest'
import { schemas } from '@dcc/contracts'
import type * as z from 'zod'

import { applyMissionStateUpdate } from './mission-state-update'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type CoalitionData = Campaign['coalitions']['player']
type FlightGroup = CoalitionData['flightGroups'][number]
type MissionState = z.infer<typeof schemas.missionState>

const campaignTime = new Date('2026-01-01T12:00:00.000Z')

function secondsAfterMidnight(hour: number, minute = 0) {
  return hour * 3600 + minute * 60
}

function createCoalition(id: 'player' | 'opponent'): CoalitionData {
  return {
    id,
    aircraftTypes: {
      CAP: ['F-16C_50'],
      'Pinpoint Strike': ['F-16C_50'],
      SEAD: ['F-16C_50'],
      DEAD: ['F-16C_50'],
      CAS: ['F-16C_50'],
      Transport: ['UH-60L']
    } as CoalitionData['aircraftTypes'],
    groundUnitTypes: {} as CoalitionData['groundUnitTypes'],
    airdromeNames: [],
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

function createFlightGroup({
  id = 'flight-1',
  callsign = 'Enfield-1',
  startTime = campaignTime,
  clientCount = 0
}: {
  id?: string
  callsign?: string
  startTime?: Date
  clientCount?: number
} = {}): FlightGroup {
  return {
    id,
    aircrafts: [1, 2].map((unitNumber) => ({
      id: `${id}-aircraft-${unitNumber}`,
      unitName: `${callsign}-${unitNumber}`,
      aircraftName: 'F-16C_50',
      client: unitNumber <= clientCount
    })),
    task: 'CAP',
    position: { x: 0, y: 0 },
    homeBase: 'Kobuleti',
    callsign,
    flightplan: {
      id: `${id}-flightplan`,
      startTime,
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
          position: { x: 1_000_000, y: 0 },
          altitude: 0,
          speed: 150,
          type: 'Landing'
        }
      ]
    }
  }
}

function trackedUnit(name: string, groupName = 'Enfield-1'): MissionState['lostUnits'][number] {
  return {
    name,
    groupName,
    type: 'F-16C_50',
    x: 0,
    y: 0
  }
}

function aircraftPositionGroup(
  callsign = 'Enfield-1',
  units: Array<{ unitNumber: number; inAir: boolean }>
): NonNullable<MissionState['groupPositions']>['blue']['aircraft'][number] {
  return {
    name: callsign,
    x: 200,
    y: 300,
    units: units.map(({ unitNumber, inAir }) => ({
      name: `${callsign}-${unitNumber}`,
      type: 'F-16C_50',
      x: 200 + unitNumber,
      y: 300 + unitNumber,
      inAir
    }))
  }
}

function createMissionState(overrides: Partial<MissionState>): MissionState {
  return {
    missionId: 'campaign-1',
    missionEnded: true,
    time: secondsAfterMidnight(12, 30),
    ejectedPilots: [],
    lostUnits: [],
    landedUnits: [],
    cargoDeliveries: {},
    groupPositions: {
      blue: { aircraft: [], ground: [] },
      red: { aircraft: [], ground: [] }
    },
    ...overrides
  }
}

describe('applyMissionStateUpdate flight group cleanup', () => {
  test('removes a flight group when every aircraft landed', () => {
    const campaign = createCampaign()
    campaign.coalitions.player.flightGroups = [createFlightGroup()]
    campaign.coalitions.player.packages = [
      {
        id: 'package-1',
        type: 'Strike Package',
        targetObjectiveId: 'target-1',
        members: [{ flightGroupId: 'flight-1', role: 'primary', totOffset: 0 }],
        tot: campaignTime,
        status: 'active'
      }
    ]

    const updated = applyMissionStateUpdate(
      campaign,
      createMissionState({
        landedUnits: [trackedUnit('Enfield-1-1'), trackedUnit('Enfield-1-2')],
        groupPositions: {
          blue: { aircraft: [aircraftPositionGroup('Enfield-1', [])], ground: [] },
          red: { aircraft: [], ground: [] }
        }
      })
    )

    expect(updated.coalitions.player.flightGroups).toHaveLength(0)
    expect(updated.coalitions.player.packages).toHaveLength(0)
  })

  test('removes a flight group when all aircraft are destroyed or landed', () => {
    const campaign = createCampaign()
    campaign.coalitions.player.flightGroups = [createFlightGroup()]

    const updated = applyMissionStateUpdate(
      campaign,
      createMissionState({
        lostUnits: [trackedUnit('Enfield-1-1')],
        landedUnits: [trackedUnit('Enfield-1-2')],
        groupPositions: {
          blue: {
            aircraft: [aircraftPositionGroup('Enfield-1', [{ unitNumber: 2, inAir: false }])],
            ground: []
          },
          red: { aircraft: [], ground: [] }
        }
      })
    )

    expect(updated.coalitions.player.flightGroups).toHaveLength(0)
  })

  test('keeps airborne survivors and removes terminal aircraft from the group', () => {
    const campaign = createCampaign()
    campaign.coalitions.player.flightGroups = [createFlightGroup()]

    const updated = applyMissionStateUpdate(
      campaign,
      createMissionState({
        landedUnits: [trackedUnit('Enfield-1-1')],
        groupPositions: {
          blue: {
            aircraft: [
              aircraftPositionGroup('Enfield-1', [
                { unitNumber: 1, inAir: false },
                { unitNumber: 2, inAir: true }
              ])
            ],
            ground: []
          },
          red: { aircraft: [], ground: [] }
        }
      })
    )

    expect(updated.coalitions.player.flightGroups).toHaveLength(1)
    expect(updated.coalitions.player.flightGroups[0]?.aircrafts).toHaveLength(1)
    expect(updated.coalitions.player.flightGroups[0]?.aircrafts[0]?.unitName).toBe('Enfield-1-2')
    expect(updated.coalitions.player.flightGroups[0]?.position).toEqual({ x: 200, y: 300 })
  })

  test('removes a client flight group when all clients are done but AI remains airborne', () => {
    const campaign = createCampaign()
    campaign.coalitions.player.flightGroups = [createFlightGroup({ clientCount: 1 })]

    const updated = applyMissionStateUpdate(
      campaign,
      createMissionState({
        landedUnits: [trackedUnit('Enfield-1-1')],
        groupPositions: {
          blue: {
            aircraft: [
              aircraftPositionGroup('Enfield-1', [
                { unitNumber: 1, inAir: false },
                { unitNumber: 2, inAir: true }
              ])
            ],
            ground: []
          },
          red: { aircraft: [], ground: [] }
        }
      })
    )

    expect(updated.coalitions.player.flightGroups).toHaveLength(0)
  })

  test('keeps a client flight group while a client is still airborne', () => {
    const campaign = createCampaign()
    campaign.coalitions.player.flightGroups = [createFlightGroup({ clientCount: 2 })]

    const updated = applyMissionStateUpdate(
      campaign,
      createMissionState({
        landedUnits: [trackedUnit('Enfield-1-1')],
        groupPositions: {
          blue: {
            aircraft: [
              aircraftPositionGroup('Enfield-1', [
                { unitNumber: 1, inAir: false },
                { unitNumber: 2, inAir: true }
              ])
            ],
            ground: []
          },
          red: { aircraft: [], ground: [] }
        }
      })
    )

    expect(updated.coalitions.player.flightGroups).toHaveLength(1)
    expect(updated.coalitions.player.flightGroups[0]?.aircrafts).toHaveLength(1)
    expect(updated.coalitions.player.flightGroups[0]?.aircrafts[0]?.unitName).toBe('Enfield-1-2')
    expect(updated.coalitions.player.flightGroups[0]?.aircrafts[0]?.client).toBe(true)
  })

  test('removes a client flight group when all clients are destroyed or landed', () => {
    const campaign = createCampaign()
    campaign.coalitions.player.flightGroups = [createFlightGroup({ clientCount: 1 })]

    const updated = applyMissionStateUpdate(
      campaign,
      createMissionState({
        lostUnits: [trackedUnit('Enfield-1-1')],
        groupPositions: {
          blue: {
            aircraft: [aircraftPositionGroup('Enfield-1', [{ unitNumber: 2, inAir: true }])],
            ground: []
          },
          red: { aircraft: [], ground: [] }
        }
      })
    )

    expect(updated.coalitions.player.flightGroups).toHaveLength(0)
  })

  test('removes a flight group when every aircraft was destroyed', () => {
    const campaign = createCampaign()
    campaign.coalitions.player.flightGroups = [createFlightGroup()]

    const updated = applyMissionStateUpdate(
      campaign,
      createMissionState({
        lostUnits: [trackedUnit('Enfield-1-1'), trackedUnit('Enfield-1-2')]
      })
    )

    expect(updated.coalitions.player.flightGroups).toHaveLength(0)
  })

  test('does not remove a parked future group without landing events', () => {
    const campaign = createCampaign()
    campaign.coalitions.player.flightGroups = [
      createFlightGroup({ startTime: new Date('2026-01-01T13:00:00.000Z') })
    ]

    const updated = applyMissionStateUpdate(
      campaign,
      createMissionState({
        groupPositions: {
          blue: {
            aircraft: [
              aircraftPositionGroup('Enfield-1', [
                { unitNumber: 1, inAir: false },
                { unitNumber: 2, inAir: false }
              ])
            ],
            ground: []
          },
          red: { aircraft: [], ground: [] }
        }
      })
    )

    expect(updated.coalitions.player.flightGroups).toHaveLength(1)
    expect(updated.coalitions.player.flightGroups[0]?.aircrafts).toHaveLength(2)
  })
})
