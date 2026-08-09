import { describe, expect, test, vi, afterEach } from 'vitest'
import { config, schemas } from '@dcc/contracts'
import { scenarios, theatres } from '@dcc/data'
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

function createOpponentContext(): SpawnContext {
  return {
    ...createContext(),
    enemyCoalition: 'player',
    theatre: {
      ...createContext().theatre,
      airdromeDetails: {
        Home: { name: 'Home', x: 0, y: 0, runwayAngle: 90 },
        Enemy: { name: 'Enemy', x: 100_000, y: 0, runwayAngle: 270 },
        'Enemy Reserve': { name: 'Enemy Reserve', x: 150_000, y: 0, runwayAngle: 270 }
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
  test('keeps the Falklands carrier clear of land while preserving Harrier mission reach', () => {
    const scenario = scenarios.find((entry) => entry.id === 'falklands-1982')
    const theatre = theatres.find((entry) => entry.name === scenario?.theatreName)
    const carrier = scenario?.navalGroups?.player.find((group) => group.role === 'carrier')
    const escort = scenario?.navalGroups?.player.find((group) => group.role === 'escort')
    const argentineSurfaceGroup = scenario?.navalGroups?.opponent.find(
      (group) => group.role === 'surface-combatant'
    )
    const stanley = theatre?.objectives.find((objective) => objective.name === 'Stanley Airport')
    const foxBay = theatre?.objectives.find((objective) => objective.name === 'Fox Bay')
    const distance = (left: { x: number; y: number }, right: { x: number; y: number }) =>
      Math.hypot(left.x - right.x, left.y - right.y)

    expect(carrier).toBeDefined()
    expect(escort).toBeDefined()
    expect(argentineSurfaceGroup).toBeDefined()
    expect(stanley).toBeDefined()
    expect(foxBay).toBeDefined()

    expect(distance(carrier!.position, stanley!.position)).toBeGreaterThan(
      config.packages.CAP.engagementRange
    )
    expect(distance(carrier!.position, foxBay!.position)).toBeLessThanOrEqual(
      config.packages.CAS.maxDistance
    )
    expect(distance(carrier!.position, argentineSurfaceGroup!.position)).toBeLessThanOrEqual(
      config.packages['Antiship Strike'].maxDistance
    )
    expect(distance(carrier!.position, escort!.position)).toBeLessThan(10_000)
  })

  test('emits CAP for an uncovered reachable airbase lane', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({ playerAircraft: { CAP: ['F-16C_50'] } })

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())

    expect(result.admitted.some((plan) => plan.kind === 'cap')).toBe(true)
  })

  test('uses another reachable airbase when the nearest base cannot support combat flights', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({ opponentAircraft: { CAP: ['MiG-21Bis'] } })
    campaign.coalitions.opponent.airdromeNames = ['Enemy', 'Enemy Reserve']
    campaign.coalitions.opponent.supplyNodes = {
      Enemy: {
        current: 100,
        max: 1000,
        productionRate: 0,
        consumptionRate: 0,
        status: 'critical'
      },
      'Enemy Reserve': {
        current: 10_000,
        max: 10_000,
        productionRate: 20,
        consumptionRate: 0,
        status: 'abundant'
      }
    }

    const result = planAtoPackages(campaign, 'opponent', createOpponentContext(), plannerPolicy())
    const cap = result.admitted.find((plan) => plan.kind === 'cap')

    expect(cap?.flights[0]?.homeBase.name).toBe('Enemy Reserve')
  })

  test('randomly picks among viable reachable airbases for normal tasks', () => {
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValueOnce(0.9).mockReturnValue(0)
    const campaign = createCampaign({ opponentAircraft: { 'Pinpoint Strike': ['MiG-21Bis'] } })
    campaign.coalitions.opponent.airdromeNames = ['Enemy', 'Enemy Reserve']
    campaign.coalitions.opponent.supplyNodes = {
      Enemy: {
        current: 10_000,
        max: 10_000,
        productionRate: 20,
        consumptionRate: 0,
        status: 'abundant'
      },
      'Enemy Reserve': {
        current: 10_000,
        max: 10_000,
        productionRate: 20,
        consumptionRate: 0,
        status: 'abundant'
      }
    }
    campaign.coalitions.player.structures = [
      {
        id: 'structure-1',
        type: 'Ammo Depot',
        objectiveId: 'Home Objective',
        position: { x: 0, y: 0 },
        name: 'Ammo Depot',
        resources: 0,
        buildings: [{ offset: { x: 0, y: 0 }, type: 'Workshop A', alive: true }]
      }
    ]

    const result = planAtoPackages(campaign, 'opponent', createOpponentContext(), plannerPolicy())
    const strike = result.admitted.find((plan) => plan.kind === 'strike')

    expect(strike?.flights[0]?.homeBase.name).toBe('Enemy Reserve')
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

  test('uses DEAD-capable aircraft from other task lists when saved DEAD list is empty', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({
      playerAircraft: {
        DEAD: [],
        SEAD: ['F-4E-45MC'],
        'Ground Attack': ['F-4E-45MC']
      }
    })
    campaign.coalitions.opponent.samGroups = [
      { id: 'sam-1', type: 'SA-6', objectiveId: 'Target Objective' }
    ]

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())
    const dead = result.admitted.find((plan) => plan.kind === 'dead')

    expect(dead?.flights[0]?.aircraftType).toBe('F-4E-45MC')
  })

  test('uses AI-only Russian DEAD-capable aircraft from other task lists when saved DEAD list is empty', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({
      playerAircraft: {
        DEAD: [],
        SEAD: ['Su-17M4'],
        'Ground Attack': ['Su-17M4']
      }
    })
    campaign.coalitions.opponent.samGroups = [
      { id: 'sam-1', type: 'SA-6', objectiveId: 'Target Objective' }
    ]

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())
    const dead = result.admitted.find((plan) => plan.kind === 'dead')

    expect(dead?.flights[0]?.aircraftType).toBe('Su-17M4')
  })

  test('prioritizes DEAD for active SAMs when package admission is constrained', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({
      playerAircraft: {
        CAP: ['F-16C_50'],
        DEAD: ['F-16C_50'],
        'Pinpoint Strike': ['F-16C_50']
      }
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

    const result = planAtoPackages(
      campaign,
      'player',
      createContext(),
      plannerPolicy({ maxNewPackagesPerLogicTick: 2 })
    )

    expect(result.admitted.map((plan) => plan.kind)).toContain('dead')
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
        units: [{ name: 'BMP-2', count: 4 }]
      }
    ]

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())

    expect(result.admitted.some((plan) => plan.kind === 'cas')).toBe(true)
  })

  test('uses a FARP as the home base for helicopter CAS', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({ playerAircraft: { CAS: ['AH-64D_BLK_II'] } })
    campaign.coalitions.player.airdromeNames = []
    campaign.coalitions.player.structures = [
      {
        id: 'farp-1',
        type: 'Farp',
        objectiveId: 'Home Objective',
        position: { x: 40_000, y: 0 },
        name: 'Forward FARP',
        resources: 0,
        buildings: []
      }
    ]
    campaign.coalitions.opponent.groundGroups = [
      {
        id: 'ground-1',
        objectiveId: 'Target Objective',
        position: { x: 50_000, y: 0 },
        state: 'idle',
        units: [{ name: 'BMP-2', count: 4 }]
      }
    ]

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())
    const cas = result.admitted.find((plan) => plan.kind === 'cas')

    expect(cas?.flights[0]?.homeBase).toMatchObject({
      name: 'farp-1',
      position: { x: 40_000, y: 0 }
    })
    expect(cas?.flights[0]?.aircraftType).toBe('AH-64D_BLK_II')

    if (cas) commitAtoPackages(campaign, 'player', [cas])
    expect(campaign.coalitions.player.flightGroups[0]).toMatchObject({
      homeBase: 'farp-1',
      position: { x: 40_000, y: 0 },
      task: 'CAS'
    })
  })

  test('does not use a FARP as the home base for fixed-wing CAS', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({ playerAircraft: { CAS: ['A-10C_2'] } })
    campaign.coalitions.player.airdromeNames = []
    campaign.coalitions.player.structures = [
      {
        id: 'farp-1',
        type: 'Farp',
        objectiveId: 'Home Objective',
        position: { x: 40_000, y: 0 },
        name: 'Forward FARP',
        resources: 0,
        buildings: []
      }
    ]
    campaign.coalitions.opponent.groundGroups = [
      {
        id: 'ground-1',
        objectiveId: 'Target Objective',
        position: { x: 50_000, y: 0 },
        state: 'idle',
        units: [{ name: 'BMP-2', count: 4 }]
      }
    ]

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())

    expect(result.admitted.some((plan) => plan.kind === 'cas')).toBe(false)
  })

  test('emits defensive CAS with a staged battle lock for an attack on a friendly objective', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({ playerAircraft: { CAS: ['A-10C_2'] } })
    campaign.coalitions.player.groundGroups = [
      {
        id: 'defender-1',
        objectiveId: 'Home Objective',
        position: { x: 0, y: 0 },
        state: 'idle',
        units: [{ name: 'M-1 Abrams', count: 2 }]
      }
    ]
    campaign.coalitions.opponent.groundGroups = [
      {
        id: 'attacker-1',
        objectiveId: 'Target Objective',
        targetObjectiveId: 'Home Objective',
        position: { x: 5_000, y: 0 },
        state: 'moving',
        units: [{ name: 'BMP-2', count: 4 }]
      }
    ]

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())
    const cas = result.admitted.find((plan) => plan.variantId === 'defensive-cas')

    expect(cas?.variantLabel).toBe('Defensive CAS')
    expect(cas?.battleLock?.attackerGroupIds).toEqual(['attacker-1'])
    expect(cas?.battleLock?.defenderGroupIds).toContain('defender-1')
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

  test('does not emit transport when logistics planning is disabled', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign({ playerAircraft: { Transport: ['C-130'] } })
    campaign.coalitions.player.supplyNodes!['Home Objective'] = {
      current: 100,
      max: 1000,
      productionRate: 0,
      consumptionRate: 0,
      status: 'critical'
    }

    const result = planAtoPackages(campaign, 'player', createContext(), plannerPolicy())

    expect(result.admitted.some((plan) => plan.kind === 'transport')).toBe(false)
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
