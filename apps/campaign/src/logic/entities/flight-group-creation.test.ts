import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { schemas, config } from '@dcc/contracts'
import type * as z from 'zod'

import { CapFlightGroup } from './cap-flight-group'
import { DeadFlightGroup } from './dead-flight-group'
import { FlightGroup } from './flight-group'
import { buildAttackMissionWaypoints, spawnPlannedFlightGroup } from './flight-group-spawn'
import { SeadFlightGroup } from './sead-flight-group'
import { StrikeFlightGroup } from './strike-flight-group'
import { TransportFlightGroup } from './transport-flight-group'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type FlightGroupData = z.infer<typeof schemas.flightGroup>

const campaignTime = new Date('2026-01-01T12:00:00.000Z')
const homeBasePosition = { x: 0, y: 0 }
const targetPosition = { x: 100_000, y: 0 }
const patrolCenter = { x: 80_000, y: 40_000 }
const target = {
  id: 'target-1',
  type: 'Ammo Depot',
  objectiveId: 'objective-1'
}

function createSupply(current = 1_000) {
  return {
    current,
    max: 2_000,
    consumptionRate: 0,
    productionRate: 0,
    status: 'adequate' as const
  }
}

function createCoalition(id: 'player' | 'opponent'): Campaign['coalitions']['player'] {
  return {
    id,
    aircraftTypes: {
      CAP: ['F-16C_50'],
      'Pinpoint Strike': ['F-16C_50'],
      SEAD: ['F-16C_50'],
      DEAD: ['F-16C_50'],
      CAS: ['F-16C_50'],
      Transport: ['UH-60L']
    } as Campaign['coalitions']['player']['aircraftTypes'],
    groundUnitTypes: {} as Campaign['coalitions']['player']['groundUnitTypes'],
    airdromeNames: ['Home'],
    objectiveIds: ['objective-1'],
    structures: [],
    samGroups: [],
    groundGroups: [],
    flightGroups: [],
    packages: [],
    supplyNodes: {
      Home: createSupply(),
      'objective-1': createSupply()
    }
  }
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

function getCreatedFlightGroup(campaign: Campaign, id: string): FlightGroupData {
  const group = campaign.coalitions.player.flightGroups.find((fg) => fg.id === id)
  expect(group).toBeDefined()
  return group!
}

function expectStandardFixedWingPlan(group: FlightGroupData, taskWaypointName: string) {
  expect(group.flightplan.waypoints.map((wp) => wp.name)).toEqual([
    'TakeOff',
    'Ascend',
    'IP',
    taskWaypointName,
    'Egress',
    'Descent',
    'Landing'
  ])
  expect(group.flightplan.waypoints[0]?.type).toBe('TakeOff')
  expect(group.flightplan.waypoints.at(-1)?.type).toBe('Landing')
  expect(group.tot).toBeInstanceOf(Date)
}

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CAP flight group creation', () => {
  test('creates a CAP group with racetrack flightplan waypoints', () => {
    const campaign = createCampaign()

    const result = CapFlightGroup.spawn(campaign, 'player', {
      homeBase: 'Home',
      homeBasePosition,
      patrolCenter,
      aircraftType: 'F-16C_50'
    })

    const group = getCreatedFlightGroup(campaign, result.flightGroupId)
    expect(group.task).toBe('CAP')
    expect(group.aircrafts).toHaveLength(config.packages.CAP.aircraftsPerGroup)
    expect(group.flightplan.startTime).toEqual(new Date('2026-01-01T12:10:00.000Z'))
    expect(group.flightplan.waypoints.map((wp) => wp.name)).toEqual([
      'TakeOff',
      'Ascend',
      'Racetrack Start',
      'Racetrack End',
      'Descent',
      'Landing'
    ])
    expect(group.flightplan.waypoints[2]?.type).toBe('Task')
    expect(group.flightplan.waypoints[3]?.type).toBe('RaceTrack End')
  })
})

describe('Pinpoint Strike flight group creation', () => {
  test('creates a strike group with target metadata and attack flightplan', () => {
    const campaign = createCampaign()

    const result = StrikeFlightGroup.spawn(campaign, 'player', {
      homeBase: 'Home',
      homeBasePosition,
      target,
      targetPosition,
      aircraftType: 'F-16C_50',
      packageId: 'package-1'
    })

    const group = getCreatedFlightGroup(campaign, result.flightGroupId)
    expect(group.task).toBe('Pinpoint Strike')
    expect(group.target).toEqual(target)
    expect(group.packageId).toBe('package-1')
    expect(group.aircrafts).toHaveLength(config.packages['Pinpoint Strike'].aircraftsPerGroup)
    expectStandardFixedWingPlan(group, 'Target')
  })
})

describe('SEAD flight group creation', () => {
  test('creates a SEAD group aligned to the requested ToT', () => {
    const campaign = createCampaign()
    const desiredTot = new Date('2026-01-01T13:00:00.000Z')

    const flightGroupId = SeadFlightGroup.spawn(campaign, 'player', {
      homeBase: 'Home',
      homeBasePosition,
      target: { ...target, type: 'SA-10' },
      targetPosition,
      aircraftType: 'F-16C_50',
      tot: desiredTot,
      packageId: 'package-1'
    })

    const group = getCreatedFlightGroup(campaign, flightGroupId)
    expect(group.task).toBe('SEAD')
    expect(group.target).toEqual({ ...target, type: 'SA-10' })
    expect(group.packageId).toBe('package-1')
    expect(group.tot).toEqual(desiredTot)
    expect(group.aircrafts).toHaveLength(config.packages.SEAD.aircraftsPerGroup)
    expectStandardFixedWingPlan(group, 'Target')
  })
})

describe('DEAD flight group creation', () => {
  test('creates a DEAD group with SAM target metadata and attack flightplan', () => {
    const campaign = createCampaign()

    const result = DeadFlightGroup.spawn(campaign, 'player', {
      homeBase: 'Home',
      homeBasePosition,
      target: { ...target, type: 'SA-6' },
      targetPosition,
      aircraftType: 'F-16C_50'
    })

    const group = getCreatedFlightGroup(campaign, result.flightGroupId)
    expect(group.task).toBe('DEAD')
    expect(group.target).toEqual({ ...target, type: 'SA-6' })
    expect(group.aircrafts).toHaveLength(config.packages.DEAD.aircraftsPerGroup)
    expectStandardFixedWingPlan(group, 'Target')
  })
})

describe('CAS flight group creation', () => {
  test('creates a CAS group through the shared planned-flight helper', () => {
    const campaign = createCampaign()
    const missionWaypoints = buildAttackMissionWaypoints(homeBasePosition, targetPosition)

    const result = spawnPlannedFlightGroup({
      draft: campaign,
      coalition: 'player',
      task: 'CAS',
      aircraftType: 'F-16C_50',
      aircraftCount: config.packages.CAS.aircraftsPerGroup,
      homeBase: 'Home',
      homeBasePosition,
      destination: targetPosition,
      missionWaypoints,
      startTime: new Date('2026-01-01T12:30:00.000Z'),
      target: { ...target, type: 'Ground Group' }
    })

    const group = getCreatedFlightGroup(campaign, result.flightGroupId)
    expect(group.task).toBe('CAS')
    expect(group.target).toEqual({ ...target, type: 'Ground Group' })
    expect(group.aircrafts).toHaveLength(config.packages.CAS.aircraftsPerGroup)
    expectStandardFixedWingPlan(group, 'Target')
  })
})

describe('Transport flight group creation', () => {
  test('creates a transport group with cargo metadata and direct low-level flightplan', () => {
    const campaign = createCampaign()

    const result = TransportFlightGroup.spawn(campaign, 'player', {
      homeBase: 'Home',
      homeBasePosition,
      destinationPosition: targetPosition,
      sourceNode: 'Home',
      destinationNode: 'objective-1',
      aircraftType: 'UH-60L',
      cargoAmount: 250,
      transportType: 'tactical'
    })

    const group = getCreatedFlightGroup(campaign, result.flightGroupId)
    expect(group.task).toBe('Transport')
    expect(group.aircrafts).toHaveLength(config.packages.Transport.aircraftsPerGroup)
    expect(group.cargoAmount).toBe(250)
    expect(group.sourceNode).toBe('Home')
    expect(group.destinationNode).toBe('objective-1')
    expect(group.cargoStatus).toBe('loaded')
    expect(group.transportType).toBe('tactical')
    expect(campaign.coalitions.player.supplyNodes?.Home?.current).toBe(750)
    expect(group.flightplan.waypoints.map((wp) => wp.name)).toEqual([
      'TakeOff',
      'Direct',
      'Landing'
    ])
    expect(group.flightplan.waypoints[1]).toMatchObject({
      altitude: 300,
      speed: 100,
      type: 'Nav'
    })
  })
})

describe('Generic flight group creation', () => {
  test('stores the supplied flightplan, aircraft, home base, and calculated ToT', () => {
    const campaign = createCampaign()
    const flightplan = FlightGroup.createFlightPlan(
      homeBasePosition,
      targetPosition,
      buildAttackMissionWaypoints(homeBasePosition, targetPosition),
      new Date('2026-01-01T12:45:00.000Z')
    )

    const flightGroupId = FlightGroup.create(campaign, 'player', {
      aircrafts: [
        {
          id: 'aircraft-1',
          unitName: 'F-16C_50 1',
          aircraftName: 'F-16C_50'
        }
      ],
      task: 'Ground Attack',
      position: homeBasePosition,
      homeBase: 'Home',
      flightplan
    })

    const group = getCreatedFlightGroup(campaign, flightGroupId)
    expect(group.task).toBe('Ground Attack')
    expect(group.homeBase).toBe('Home')
    expect(group.flightplan).toBe(flightplan)
    expect(group.tot).toEqual(FlightGroup.calculateTot(flightplan))
  })
})
