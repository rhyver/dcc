import { describe, expect, test, vi, afterEach } from 'vitest'
import { schemas } from '@dcc/contracts'
import type * as z from 'zod'

import {
  commitAtoPackages,
  defaultAtoPlannerPolicy,
  planAtoPackages,
  type AtoPlannerPolicy
} from './ato-planner'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type CoalitionData = Campaign['coalitions']['player']
type SpawnContext = Parameters<typeof planAtoPackages>[2]

const campaignTime = new Date('2026-01-01T12:00:00.000Z')

afterEach(() => {
  vi.restoreAllMocks()
})

function createAircraftTypes(overrides: Partial<CoalitionData['aircraftTypes']> = {}) {
  return {
    ...Object.fromEntries(schemas.task.options.map((task) => [task, [] as string[]])),
    ...overrides
  } as CoalitionData['aircraftTypes']
}

function createGroundUnitTypes(): CoalitionData['groundUnitTypes'] {
  return Object.fromEntries(
    schemas.groundUnitType.options.map((type) => [type, [] as string[]])
  ) as CoalitionData['groundUnitTypes']
}

function createCoalition(
  id: 'player' | 'opponent',
  aircraftTypes: Partial<CoalitionData['aircraftTypes']> = {}
): CoalitionData {
  return {
    id,
    aircraftTypes: createAircraftTypes(aircraftTypes),
    groundUnitTypes: createGroundUnitTypes(),
    airdromeNames: id === 'player' ? ['Home'] : ['Enemy'],
    objectiveIds: id === 'player' ? ['Home Objective'] : ['Target Objective'],
    structures: [],
    samGroups: [],
    groundGroups: [],
    flightGroups: [],
    packages: [],
    supplyNodes: {
      Home: {
        current: 10_000,
        max: 10_000,
        productionRate: 0,
        consumptionRate: 0,
        status: 'abundant'
      },
      'Home Objective': {
        current: 800,
        max: 1000,
        productionRate: 0,
        consumptionRate: 0,
        status: 'abundant'
      },
      Enemy: {
        current: 10_000,
        max: 10_000,
        productionRate: 0,
        consumptionRate: 0,
        status: 'abundant'
      },
      'Target Objective': {
        current: 800,
        max: 1000,
        productionRate: 0,
        consumptionRate: 0,
        status: 'abundant'
      }
    }
  }
}

function createCampaign(
  params: {
    playerAircraft?: Partial<CoalitionData['aircraftTypes']>
    opponentAircraft?: Partial<CoalitionData['aircraftTypes']>
  } = {}
): Campaign {
  return {
    version: 'test',
    id: 'campaign-1',
    name: 'Test Campaign',
    createdAt: campaignTime,
    updatedAt: campaignTime,
    time: campaignTime,
    timeMultiplier: 1,
    logs: [],
    scenarioId: 'test-scenario',
    coalitions: {
      player: createCoalition('player', params.playerAircraft),
      opponent: createCoalition('opponent', params.opponentAircraft)
    }
  }
}

function createContext(): SpawnContext {
  return {
    enemyCoalition: 'opponent',
    scenario: {
      id: 'test-scenario',
      name: 'Test Scenario',
      description: '',
      theatreName: 'Test',
      available: true,
      goal: { coalition: 'player', objectiveIds: ['Target Objective'] },
      start: {
        player: { objectiveIds: ['Home Objective'], airdromeNames: ['Home'] },
        opponent: { objectiveIds: ['Target Objective'], airdromeNames: ['Enemy'] }
      }
    } as unknown as SpawnContext['scenario'],
    theatre: {
      name: 'Test',
      info: { center: { x: 0, y: 0 } },
      objectives: [
        { name: 'Home Objective', type: 'Frontline', position: { x: 0, y: 0 } },
        { name: 'Target Objective', type: 'Frontline', position: { x: 50_000, y: 0 } }
      ],
      targets: {},
      airdromeDetails: {
        Home: { name: 'Home', x: 0, y: 0, runwayAngle: 90 },
        Enemy: { name: 'Enemy', x: 100_000, y: 0, runwayAngle: 270 }
      }
    } as unknown as SpawnContext['theatre']
  }
}

function plannerPolicy(overrides: Partial<AtoPlannerPolicy> = {}): AtoPlannerPolicy {
  return {
    ...defaultAtoPlannerPolicy,
    maxNewPackagesPerLogicTick: 10,
    maxActivePackages: 10,
    maxActiveAircraft: 40,
    ...overrides
  }
}

describe('ATO package planner', () => {
  test('emits CAP for an uncovered reachable airbase lane', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({ playerAircraft: { CAP: ['F-16C_50'] } })

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())

    expect(result.admitted.some((plan) => plan.kind === 'cap')).toBe(true)
  })

  test('emits strike plus SEAD when a reachable structure is covered by an operational SAM', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({
      playerAircraft: { 'Pinpoint Strike': ['F-16C_50'], SEAD: ['F-16C_50'] }
    })
    campaign.coalitions.opponent.structures = [
      {
        id: 'structure-1',
        type: 'Ammo Depot',
        objectiveId: 'Target Objective',
        position: { x: 50_000, y: 0 },
        name: 'Ammo Depot',
        resources: 0,
        buildings: [{ offset: { x: 0, y: 0 }, type: 'Workshop A', alive: true }]
      }
    ]
    campaign.coalitions.opponent.samGroups = [
      { id: 'sam-1', type: 'SA-6', objectiveId: 'Target Objective' }
    ]

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())
    const strike = result.admitted.find((plan) => plan.kind === 'strike')

    expect(strike?.flights.map((flight) => flight.task)).toEqual(['Pinpoint Strike', 'SEAD'])
  })

  test('emits standalone DEAD for an untargeted SAM', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({ playerAircraft: { DEAD: ['F-16C_50'] } })
    campaign.coalitions.opponent.samGroups = [
      { id: 'sam-1', type: 'SA-6', objectiveId: 'Target Objective' }
    ]

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())

    expect(result.admitted.some((plan) => plan.kind === 'dead')).toBe(true)
  })

  test('emits CAS for a valid enemy ground group', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({ playerAircraft: { CAS: ['A-10C_2'] } })
    campaign.coalitions.opponent.groundGroups = [
      {
        id: 'ground-1',
        objectiveId: 'Target Objective',
        position: { x: 50_000, y: 0 },
        state: 'idle',
        units: [{ name: 'BMP-2', count: 3 }]
      }
    ]

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())

    expect(result.admitted.some((plan) => plan.kind === 'cas')).toBe(true)
  })

  test('emits transport for urgent supply when policy enables logistics planning', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({ playerAircraft: { Transport: ['C-130'] } })
    campaign.coalitions.player.supplyNodes!['Home Objective'] = {
      current: 100,
      max: 1000,
      productionRate: 0,
      consumptionRate: 0,
      status: 'critical'
    }

    const result = planAtoPackages(
      campaign,
      'player',
      createContext(),
      plannerPolicy({ enableTransport: true })
    )

    expect(result.admitted.some((plan) => plan.kind === 'transport')).toBe(true)
  })

  test('rejects candidates when aircraft are unavailable', () => {
    const campaign = createCampaign()

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())

    expect(result.rejected.some((entry) => entry.reason === 'no aircraft')).toBe(true)
  })

  test('rejects strike packages when home-base munitions are exhausted', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({ playerAircraft: { 'Pinpoint Strike': ['F-16C_50'] } })
    campaign.coalitions.player.supplyNodes!.Home = {
      current: 10_000,
      max: 10_000,
      productionRate: 0,
      consumptionRate: 0,
      status: 'abundant',
      fuel: { current: 10_000, max: 10_000, productionRate: 0, consumptionRate: 0 },
      munitions: { current: 10, max: 10_000, productionRate: 0, consumptionRate: 0 },
      repair: { current: 10_000, max: 10_000, productionRate: 0, consumptionRate: 0 },
      logistics: { hub: true, hubLevel: 2, routes: [], interdiction: 0, repairRate: 0 }
    }
    campaign.coalitions.opponent.structures = [
      {
        id: 'structure-1',
        type: 'Ammo Depot',
        objectiveId: 'Target Objective',
        position: { x: 50_000, y: 0 },
        name: 'Ammo Depot',
        resources: 0,
        buildings: [{ offset: { x: 0, y: 0 }, type: 'Workshop A', alive: true }]
      }
    ]

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())

    expect(result.admitted.some((plan) => plan.kind === 'strike')).toBe(false)
    expect(
      result.rejected.some((entry) => entry.kind === 'strike' && entry.reason === 'supply blocked')
    ).toBe(true)
  })

  test('spends virtual logistics when admitted packages are committed', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({ playerAircraft: { CAP: ['F-16C_50'] } })
    campaign.coalitions.player.supplyNodes!.Home = {
      current: 10_000,
      max: 10_000,
      productionRate: 0,
      consumptionRate: 0,
      status: 'abundant',
      fuel: { current: 10_000, max: 10_000, productionRate: 0, consumptionRate: 0 },
      munitions: { current: 10_000, max: 10_000, productionRate: 0, consumptionRate: 0 },
      repair: { current: 10_000, max: 10_000, productionRate: 0, consumptionRate: 0 },
      logistics: { hub: true, hubLevel: 2, routes: [], interdiction: 0, repairRate: 0 }
    }

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())
    const cap = result.admitted.filter((plan) => plan.kind === 'cap')
    commitAtoPackages(campaign, 'player', cap)

    expect(campaign.coalitions.player.supplyNodes?.Home?.fuel?.current).toBeLessThan(10_000)
    expect(campaign.coalitions.player.supplyNodes?.Home?.munitions?.current).toBeLessThan(10_000)
    expect(campaign.coalitions.player.flightGroups[0]?.packageId).toBe(cap[0]?.id)
  })

  test('does not duplicate targets already assigned to active flights', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({ playerAircraft: { DEAD: ['F-16C_50'] } })
    campaign.coalitions.opponent.samGroups = [
      { id: 'sam-1', type: 'SA-6', objectiveId: 'Target Objective' }
    ]
    campaign.coalitions.player.flightGroups = [
      {
        id: 'flight-1',
        aircrafts: [{ id: 'aircraft-1', unitName: 'Enfield-1-1', aircraftName: 'F-16C_50' }],
        task: 'DEAD',
        position: { x: 0, y: 0 },
        homeBase: 'Home',
        callsign: 'Enfield-1',
        target: { id: 'sam-1', type: 'SA-6', objectiveId: 'Target Objective' },
        flightplan: { id: 'plan-1', startTime: campaignTime, waypoints: [] }
      }
    ]

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())

    expect(result.admitted.some((plan) => plan.targetId === 'sam-1')).toBe(false)
  })
})
