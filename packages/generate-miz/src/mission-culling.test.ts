import { schemas } from '@dcc/contracts'
import { structureTemplates } from '@dcc/data'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'

import { addGroundGroups } from './add-ground-groups'
import { addStructures } from './add-structures'
import { buildMissionCullingPlan } from './mission-culling'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type CampaignCoalition = Campaign['coalitions']['player']
type Mission = z.infer<typeof schemas.dcs.mission>
type Theatre = z.infer<typeof schemas.theatre>

const campaignTime = new Date('2026-01-01T12:00:00.000Z')

function createAircraftTypes(): CampaignCoalition['aircraftTypes'] {
  return Object.fromEntries(
    schemas.task.options.map((task) => [task, [] as string[]])
  ) as CampaignCoalition['aircraftTypes']
}

function createGroundUnitTypes(): CampaignCoalition['groundUnitTypes'] {
  return Object.fromEntries(
    schemas.groundUnitType.options.map((type) => [type, [] as string[]])
  ) as CampaignCoalition['groundUnitTypes']
}

function createCoalition(id: 'player' | 'opponent'): CampaignCoalition {
  const groundUnitTypes = createGroundUnitTypes()
  groundUnitTypes.Vehicle = ['M-1 Abrams']
  groundUnitTypes['Shorad Infantry'] = ['Soldier stinger']

  return {
    id,
    aircraftTypes: createAircraftTypes(),
    groundUnitTypes,
    airdromeNames: [],
    objectiveIds: [],
    structures: [],
    samGroups: [],
    groundGroups: [],
    flightGroups: [],
    packages: []
  }
}

function createCampaign(culling = true): Campaign {
  return {
    version: 'test',
    id: 'campaign',
    name: 'Campaign',
    createdAt: campaignTime,
    updatedAt: campaignTime,
    time: campaignTime,
    timeMultiplier: 1,
    campaignParams: { culling },
    logs: [],
    scenarioId: 'scenario',
    coalitions: {
      player: {
        ...createCoalition('player'),
        flightGroups: [
          {
            id: 'player-cap',
            aircrafts: [],
            task: 'CAP',
            position: { x: 0, y: 0 },
            homeBase: 'Base',
            callsign: 'Enfield-1',
            flightplan: {
              id: 'player-cap-plan',
              startTime: campaignTime,
              waypoints: [
                {
                  name: 'CAP',
                  position: { x: 0, y: 0 },
                  altitude: 6000,
                  speed: 220,
                  type: 'Task'
                }
              ]
            }
          }
        ]
      },
      opponent: createCoalition('opponent')
    }
  }
}

function createMission(): Mission {
  return {
    version: 23,
    theatre: 'Caucasus',
    currentKey: 100,
    maxDictId: 1,
    start_time: 0,
    date: { Day: 1, Month: 1, Year: 2026 },
    weather: {
      atmosphere_type: 0,
      wind: {
        at8000: { speed: 0, dir: 0 },
        atGround: { speed: 0, dir: 0 },
        at2000: { speed: 0, dir: 0 }
      },
      enable_dust: false,
      dust_density: 0,
      qnh: 760,
      groundTurbulence: 0,
      type_weather: 0,
      season: { temperature: 20 },
      visibility: { distance: 80000 },
      clouds: { density: 0, thickness: 200, base: 2500, iprecptns: 0 }
    },
    map: { centerY: 0, zoom: 1, centerX: 0 },
    coalitions: { neutrals: [], blue: [2], red: [0] },
    coalition: {
      neutrals: { bullseye: { x: 0, y: 0 }, nav_points: [], name: 'neutrals', country: [] },
      blue: {
        bullseye: { x: 0, y: 0 },
        nav_points: [],
        name: 'blue',
        country: [{ id: 2, name: 'USA', static: { group: [] }, vehicle: { group: [] } }]
      },
      red: {
        bullseye: { x: 0, y: 0 },
        nav_points: [],
        name: 'red',
        country: [{ id: 0, name: 'Russia', static: { group: [] }, vehicle: { group: [] } }]
      }
    },
    result: { total: 0, offline: {}, blue: {}, red: {} }
  }
}

const theatre: Theatre = {
  name: 'Caucasus',
  objectives: [
    { name: 'near-objective', type: 'Frontline', position: { x: 10_000, y: 0 } },
    { name: 'far-objective', type: 'Frontline', position: { x: 100_000, y: 0 } },
    { name: 'sam-objective', type: 'Frontline', position: { x: 150_000, y: 0 } }
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

function addTestStructures(campaign: Campaign) {
  campaign.coalitions.opponent.structures = [
    {
      id: 'near-structure',
      type: 'Depot',
      objectiveId: 'near-objective',
      position: { x: 10_000, y: 0 },
      name: 'Near Structure',
      resources: 0,
      buildings: [
        { type: 'Warehouse', offset: { x: 0, y: 0 }, alive: true },
        { type: 'Tank', offset: { x: 100, y: 0 }, alive: false }
      ]
    },
    {
      id: 'far-structure',
      type: 'Depot',
      objectiveId: 'far-objective',
      position: { x: 100_000, y: 0 },
      name: 'Far Structure',
      resources: 0,
      buildings: [{ type: 'Warehouse', offset: { x: 0, y: 0 }, alive: true }]
    }
  ]
}

function addTestGroundGroups(campaign: Campaign) {
  campaign.coalitions.opponent.groundGroups = [
    {
      id: 'near-ground',
      objectiveId: 'near-objective',
      position: { x: 10_000, y: 0 },
      state: 'idle',
      units: [{ name: 'M-1 Abrams', count: 2 }]
    },
    {
      id: 'far-ground',
      objectiveId: 'far-objective',
      position: { x: 100_000, y: 0 },
      state: 'idle',
      units: [{ name: 'M-1 Abrams', count: 2 }]
    },
    {
      id: 'mixed-ground',
      objectiveId: 'far-objective',
      position: { x: 120_000, y: 0 },
      state: 'idle',
      units: [
        { name: 'M-1 Abrams', count: 2 },
        { name: 'Soldier stinger', count: 1 }
      ]
    }
  ]
  campaign.coalitions.opponent.samGroups = [
    {
      id: 'far-sam',
      type: 'SA-6',
      objectiveId: 'sam-objective'
    }
  ]
}

describe('mission culling', () => {
  test.each([undefined, 'Average', 'Random'] as const)(
    'generates enemy ground and SAM units at %s skill while preserving friendly units',
    (enemySkill) => {
      const campaign = createCampaign(false)
      campaign.campaignParams = { culling: false, enemySkill }
      addTestGroundGroups(campaign)
      campaign.coalitions.player.groundGroups = structuredClone(
        campaign.coalitions.opponent.groundGroups
      )
      campaign.coalitions.player.samGroups = structuredClone(campaign.coalitions.opponent.samGroups)
      const mission = createMission()

      expect(addGroundGroups(mission, campaign, theatre).isOk()).toBe(true)

      for (const [side, expectedSkill] of [
        ['blue', 'High'],
        ['red', enemySkill ?? 'High']
      ] as const) {
        const groups = mission.coalition[side].country?.[0]?.vehicle?.group ?? []
        expect(groups.some((group) => group.name.startsWith('SAM-'))).toBe(true)
        expect(groups.some((group) => group.name.startsWith('Ground-'))).toBe(true)
        expect(new Set(groups.flatMap((group) => group.units).map((unit) => unit.skill))).toEqual(
          new Set([expectedSkill])
        )
      }
    }
  )

  test('keeps a FARP used as a flight home base', () => {
    const campaign = createCampaign()
    const farpTemplate = structureTemplates.Farp[0]
    expect(farpTemplate).toBeDefined()

    const farp = {
      id: 'farp-home',
      type: 'Farp' as const,
      objectiveId: 'far-objective',
      position: { x: 100_000, y: 0 },
      name: 'Forward FARP',
      resources: 0,
      buildings: farpTemplate!.buildings.map((building) => ({ ...building, alive: true }))
    }
    campaign.coalitions.player.structures = [farp]
    campaign.coalitions.player.flightGroups[0]!.homeBase = farp.id

    const cullingPlan = buildMissionCullingPlan(campaign, theatre)

    expect(cullingPlan.getStructureMode('player', farp)).toBe('full')
  })

  test('emits the complete legacy FARP template instead of the theatre placeholder', () => {
    const campaign = createCampaign(false)
    const farpTemplate = structureTemplates.Farp[0]
    expect(farpTemplate).toBeDefined()

    campaign.coalitions.player.structures = [
      {
        id: 'farp-template',
        type: 'Farp',
        objectiveId: 'far-objective',
        position: { x: 100_000, y: 0 },
        name: 'Forward FARP',
        resources: 0,
        buildings: farpTemplate!.buildings.map((building) => ({ ...building, alive: true }))
      }
    ]
    const farpTheatre: Theatre = {
      ...theatre,
      targets: {
        'far-objective': [
          {
            name: 'far-objective|Structure|1',
            type: 'Structure',
            objectiveName: 'far-objective',
            groupId: 1,
            structureType: 'Warehouse',
            structureCategory: 'Warehouses',
            position: { x: 100_000, y: 0 },
            unitPositions: [{ x: 100_000, y: 0, heading: 1 }]
          }
        ]
      }
    }
    const mission = createMission()
    const cullingPlan = buildMissionCullingPlan(campaign, farpTheatre)

    const result = addStructures(mission, campaign, farpTheatre, cullingPlan)

    expect(result.isOk()).toBe(true)
    const groups = mission.coalition.blue.country?.[0]?.static?.group ?? []
    expect(groups).toHaveLength(1)
    expect(groups[0]?.units.map((unit) => unit.type)).toEqual([
      'FARP',
      'FARP Ammo Dump Coating',
      'FARP CP Blindage',
      'FARP Fuel Depot',
      'FARP Tent',
      'FARP Tent'
    ])
    expect(groups[0]?.units.map((unit) => unit.category)).toEqual([
      'Heliports',
      'Fortifications',
      'Fortifications',
      'Fortifications',
      'Fortifications',
      'Fortifications'
    ])
    expect(groups[0]?.units[0]).toMatchObject({ x: 100_000, y: 0 })
    expect(groups[0]?.units[1]).toMatchObject({ x: 100_075, y: -75 })
  })

  test('includes nearby structures and omits distant structures while filtering dead buildings', () => {
    const campaign = createCampaign()
    addTestStructures(campaign)
    const mission = createMission()
    const cullingPlan = buildMissionCullingPlan(campaign, theatre)

    const result = addStructures(mission, campaign, theatre, cullingPlan)

    expect(result.isOk()).toBe(true)
    const groups = mission.coalition.red.country?.[0]?.static?.group ?? []
    expect(groups.map((group) => group.name)).toEqual([
      expect.stringContaining('Static-near-structure-')
    ])
    expect(groups[0]?.units.map((unit) => unit.type)).toEqual(['Warehouse'])
    expect(cullingPlan.manifest.structures.opponent).toEqual({ 'near-structure': true })
  })

  test('includes all structures when culling is disabled', () => {
    const campaign = createCampaign(false)
    addTestStructures(campaign)
    const mission = createMission()
    const cullingPlan = buildMissionCullingPlan(campaign, theatre)

    const result = addStructures(mission, campaign, theatre, cullingPlan)

    expect(result.isOk()).toBe(true)
    const groups = mission.coalition.red.country?.[0]?.static?.group ?? []
    expect(groups.map((group) => group.name)).toEqual([
      expect.stringContaining('Static-near-structure-'),
      expect.stringContaining('Static-far-structure-')
    ])
  })

  test('includes direct target structures outside the default radius', () => {
    const campaign = createCampaign()
    addTestStructures(campaign)
    campaign.coalitions.player.flightGroups[0]!.target = {
      id: 'far-structure',
      type: 'Depot',
      objectiveId: 'far-objective'
    }
    const mission = createMission()
    const cullingPlan = buildMissionCullingPlan(campaign, theatre)

    const result = addStructures(mission, campaign, theatre, cullingPlan)

    expect(result.isOk()).toBe(true)
    const groups = mission.coalition.red.country?.[0]?.static?.group ?? []
    expect(groups.map((group) => group.name)).toEqual([
      expect.stringContaining('Static-near-structure-'),
      expect.stringContaining('Static-far-structure-')
    ])
  })

  test('culls regular ground groups, keeps nearby groups, emits distant mixed AA only, and always keeps SAMs', () => {
    const campaign = createCampaign()
    addTestGroundGroups(campaign)
    const mission = createMission()
    const cullingPlan = buildMissionCullingPlan(campaign, theatre)

    const result = addGroundGroups(mission, campaign, theatre, cullingPlan)

    expect(result.isOk()).toBe(true)
    const groups = mission.coalition.red.country?.[0]?.vehicle?.group ?? []
    expect(groups.map((group) => group.name)).toEqual([
      expect.stringContaining('SAM-far-sam-SA-6-'),
      expect.stringContaining('Ground-near-ground-'),
      expect.stringContaining('Ground-mixed-ground-')
    ])
    expect(groups.find((group) => group.name.includes('Ground-near-ground-'))?.units).toHaveLength(
      2
    )
    expect(groups.find((group) => group.name.includes('Ground-mixed-ground-'))?.units).toEqual([
      expect.objectContaining({ type: 'Soldier stinger' })
    ])
    expect(cullingPlan.manifest.groundGroups.opponent).toEqual({
      'near-ground': 'full',
      'mixed-ground': 'antiAirOnly'
    })
  })
})
