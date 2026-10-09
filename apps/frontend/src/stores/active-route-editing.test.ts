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
      DEAD: [],
      AWACS: [],
      CAP: [],
      Escort: [],
      'Pinpoint Strike': [],
      'Strategic Strike': [],
      CAS: [],
      CSAR: [],
      CASEVAC: [],
      'Troop Extraction': [],
      'Air Assault': [],
      SEAD: [],
      Intercept: [],
      'Antiship Strike': [],
      'Fighter Sweep': [],
      'Ground Attack': [],
      'Runway Attack': [],
      Transport: [],
      Refueling: [],
      RescueHelo: [],
      AFAC: []
    },
    groundUnitTypes: {
      SAM: [],
      Vehicle: [],
      Infantry: [],
      'Shorad Vehicle': [],
      'Shorad Infantry': [],
      EWS: []
    },
    airdromeNames: ['Home'],
    objectiveIds: [],
    structures: [],
    samGroups: [],
    groundGroups: [],
    flightGroups: [],
    packages: []
  }
}

function createFlightGroup(startTime: Date): FlightGroup {
  return {
    id: 'cap-1',
    callsign: 'Enfield-1',
    task: 'CAP',
    homeBase: 'Home',
    position: { x: 0, y: 0 },
    aircrafts: [{ id: 'cap-1-1', unitName: 'Enfield-1-1', aircraftName: 'F-16C_50' }],
    flightplan: {
      id: 'cap-1-plan',
      startTime,
      waypoints: [
        { name: 'TakeOff', position: { x: 0, y: 0 }, altitude: 0, speed: 100, type: 'TakeOff' },
        { name: 'Nav', position: { x: 10_000, y: 0 }, altitude: 6_000, speed: 220, type: 'Nav' },
        {
          name: 'CAP',
          position: { x: 20_000, y: 0 },
          altitude: 8_000,
          speed: 240,
          altitudeType: 'BARO',
          type: 'Task'
        },
        { name: 'Landing', position: { x: 0, y: 0 }, altitude: 0, speed: 100, type: 'Landing' }
      ]
    },
    tot: startTime
  }
}

function loadCampaign(startTime = new Date(campaignTime.getTime() + 60 * 60 * 1000)) {
  const campaign: Campaign = {
    version: 'test',
    id: 'campaign-1',
    name: 'Test Campaign',
    createdAt: campaignTime,
    updatedAt: campaignTime,
    time: campaignTime,
    timeMultiplier: 1,
    logs: [],
    scenarioId: 'scenario-1',
    coalitions: { player: createCoalition('player'), opponent: createCoalition('opponent') }
  }
  campaign.coalitions.player.flightGroups = [createFlightGroup(startTime)]
  activeStore.send({ type: 'loadCampaign', campaign })
}

function waypoints() {
  return activeStore.getSnapshot().context.coalitions.player.flightGroups[0]!.flightplan.waypoints
}

describe('active store route editing', () => {
  test('moves task and navigation waypoints before takeoff', () => {
    loadCampaign()

    activeStore.send({
      type: 'moveWaypoint',
      flightGroupId: 'cap-1',
      index: 2,
      position: { x: 25_000, y: 5_000 }
    })

    expect(waypoints()[2]?.position).toEqual({ x: 25_000, y: 5_000 })
  })

  test('keeps takeoff and landing waypoints fixed', () => {
    loadCampaign()

    activeStore.send({
      type: 'moveWaypoint',
      flightGroupId: 'cap-1',
      index: 0,
      position: { x: 5_000, y: 5_000 }
    })
    activeStore.send({
      type: 'moveWaypoint',
      flightGroupId: 'cap-1',
      index: 3,
      position: { x: 5_000, y: 5_000 }
    })

    expect(waypoints()[0]?.position).toEqual({ x: 0, y: 0 })
    expect(waypoints()[3]?.position).toEqual({ x: 0, y: 0 })
  })

  test('inserts a navigation waypoint using the higher adjacent altitude and speed', () => {
    loadCampaign()

    activeStore.send({
      type: 'insertWaypoint',
      flightGroupId: 'cap-1',
      afterIndex: 1,
      position: { x: 15_000, y: 3_000 }
    })

    expect(waypoints()).toHaveLength(5)
    expect(waypoints()[2]).toEqual({
      name: 'Nav',
      position: { x: 15_000, y: 3_000 },
      altitude: 8_000,
      altitudeType: 'BARO',
      speed: 240,
      type: 'Nav'
    })
  })

  test('removes only navigation waypoints', () => {
    loadCampaign()

    activeStore.send({ type: 'removeWaypoint', flightGroupId: 'cap-1', index: 2 })
    expect(waypoints()).toHaveLength(4)

    activeStore.send({ type: 'removeWaypoint', flightGroupId: 'cap-1', index: 1 })
    expect(waypoints().map((waypoint) => waypoint.type)).toEqual(['TakeOff', 'Task', 'Landing'])
  })

  test('ignores edits once the flight has taken off', () => {
    loadCampaign(new Date(campaignTime.getTime() - 60 * 60 * 1000))

    activeStore.send({
      type: 'moveWaypoint',
      flightGroupId: 'cap-1',
      index: 1,
      position: { x: 12_000, y: 2_000 }
    })
    activeStore.send({
      type: 'insertWaypoint',
      flightGroupId: 'cap-1',
      afterIndex: 1,
      position: { x: 15_000, y: 3_000 }
    })
    activeStore.send({ type: 'removeWaypoint', flightGroupId: 'cap-1', index: 1 })

    expect(waypoints()).toHaveLength(4)
    expect(waypoints()[1]?.position).toEqual({ x: 10_000, y: 0 })
  })
})
