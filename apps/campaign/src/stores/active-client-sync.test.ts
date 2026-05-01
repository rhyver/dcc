import { describe, expect, test } from 'vitest'
import { schemas } from '@dcc/contracts'
import type * as z from 'zod'

import { activeStore } from './active'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type CoalitionData = Campaign['coalitions']['player']
type FlightGroup = CoalitionData['flightGroups'][number]

const campaignTime = new Date('2026-01-01T12:00:00.000Z')

function createCoalition(id: 'player' | 'opponent'): CoalitionData {
  return {
    id,
    aircraftTypes: {
      CAP: [],
      'Pinpoint Strike': [],
      SEAD: [],
      DEAD: [],
      CAS: [],
      Transport: []
    },
    groundUnitTypes: {},
    airdromeNames: ['Home'],
    objectiveIds: [],
    structures: [],
    samGroups: [],
    groundGroups: [],
    flightGroups: [],
    packages: []
  } as CoalitionData
}

function createCampaign(): Campaign {
  return {
    version: 'test',
    id: 'campaign-1',
    name: 'Test Campaign',
    createdAt: campaignTime,
    time: campaignTime,
    timeMultiplier: 1,
    logs: [],
    scenarioId: 'scenario-1',
    coalitions: {
      player: createCoalition('player'),
      opponent: createCoalition('opponent')
    }
  }
}

function createFlightGroup(params: {
  id: string
  callsign: string
  startTime: string
  tot: string
  task?: FlightGroup['task']
  packageId?: string
}): FlightGroup {
  return {
    id: params.id,
    callsign: params.callsign,
    task: params.task ?? 'CAP',
    homeBase: 'Home',
    position: { x: 0, y: 0 },
    aircrafts: [
      {
        id: `${params.id}-1`,
        unitName: `${params.callsign}-1`,
        aircraftName: 'F-16C_50'
      }
    ],
    flightplan: {
      id: `${params.id}-plan`,
      startTime: new Date(params.startTime),
      waypoints: []
    },
    packageId: params.packageId,
    tot: new Date(params.tot)
  }
}

describe('active store client flight timing sync', () => {
  test('shifts ToT and package members when syncing client flight starts', () => {
    const campaign = createCampaign()
    campaign.coalitions.player.flightGroups = [
      createFlightGroup({
        id: 'strike',
        callsign: 'Enfield-1',
        task: 'Pinpoint Strike',
        packageId: 'package-1',
        startTime: '2026-01-01T12:30:00.000Z',
        tot: '2026-01-01T13:00:00.000Z'
      }),
      createFlightGroup({
        id: 'sead',
        callsign: 'Enfield-2',
        task: 'SEAD',
        packageId: 'package-1',
        startTime: '2026-01-01T12:28:00.000Z',
        tot: '2026-01-01T12:58:00.000Z'
      })
    ]
    campaign.coalitions.player.packages = [
      {
        id: 'package-1',
        type: 'SEAD Strike Package',
        targetObjectiveId: 'target-1',
        members: [
          { flightGroupId: 'strike', role: 'primary', totOffset: 0 },
          { flightGroupId: 'sead', role: 'sead', totOffset: -2 * 60 * 1000 }
        ],
        tot: new Date('2026-01-01T13:00:00.000Z'),
        status: 'active'
      }
    ]
    campaign.coalitions.opponent.flightGroups = [
      createFlightGroup({
        id: 'cap',
        callsign: 'Ford-1',
        startTime: '2026-01-01T12:10:00.000Z',
        tot: '2026-01-01T12:40:00.000Z'
      })
    ]

    activeStore.send({ type: 'loadCampaign', campaign })
    activeStore.send({ type: 'setFlightGroupClientCount', flightGroupId: 'cap', count: 1 })
    activeStore.send({ type: 'setFlightGroupClientCount', flightGroupId: 'strike', count: 1 })

    const synced = activeStore.getSnapshot().context
    const strike = synced.coalitions.player.flightGroups.find((group) => group.id === 'strike')!
    const sead = synced.coalitions.player.flightGroups.find((group) => group.id === 'sead')!
    const missionPackage = synced.coalitions.player.packages[0]!

    expect(strike.flightplan.startTime).toEqual(new Date('2026-01-01T12:10:00.000Z'))
    expect(strike.tot).toEqual(new Date('2026-01-01T12:40:00.000Z'))
    expect(sead.flightplan.startTime).toEqual(new Date('2026-01-01T12:08:00.000Z'))
    expect(sead.tot).toEqual(new Date('2026-01-01T12:38:00.000Z'))
    expect(missionPackage.tot).toEqual(new Date('2026-01-01T12:40:00.000Z'))
  })
})
