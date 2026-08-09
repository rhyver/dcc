import { schemas } from '@dcc/contracts'
import { describe, expect, test, vi } from 'vitest'
import * as z from 'zod'

import { addFlightGroups } from './add-flight-groups'
import { addNavalGroups } from './add-naval-groups'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type CampaignCoalition = Campaign['coalitions']['player']
type FlightGroup = z.infer<typeof schemas.flightGroup>
type Mission = z.infer<typeof schemas.dcs.mission>
type Theatre = z.infer<typeof schemas.theatre>
type AircraftUnit = z.infer<typeof schemas.dcs.aircraftUnit>

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
        country: [{ id: 2, name: 'USA', plane: { group: [] } }]
      },
      red: {
        bullseye: { x: 0, y: 0 },
        nav_points: [],
        name: 'red',
        country: [{ id: 0, name: 'Russia', plane: { group: [] } }]
      }
    },
    result: { total: 0, offline: {}, blue: {}, red: {} }
  }
}

function createFlightGroup(id: string, callsign: string, startTime: Date): FlightGroup {
  return {
    id,
    aircrafts: [1, 2].map((unitNumber) => ({
      id: `${id}-${unitNumber}`,
      unitName: `${callsign}-${unitNumber}`,
      aircraftName: 'F-16C_50'
    })),
    task: 'CAP',
    position: { x: 1000, y: 1000 },
    homeBase: 'Test Base',
    callsign,
    flightplan: {
      id: `${id}-plan`,
      startTime,
      waypoints: [
        {
          name: 'Take Off',
          position: { x: 1000, y: 1000 },
          altitude: 0,
          speed: 150,
          type: 'TakeOff'
        },
        {
          name: 'CAP',
          position: { x: 2000, y: 2000 },
          altitude: 6000,
          speed: 220,
          type: 'Task'
        },
        {
          name: 'Landing',
          position: { x: 1000, y: 1000 },
          altitude: 0,
          speed: 150,
          type: 'Landing'
        }
      ]
    }
  }
}

function createClientCasFlightGroup(startTime: Date): FlightGroup {
  const group = createFlightGroup('blue-cas', 'Enfield-1', startTime)
  group.task = 'CAS'
  group.aircrafts[0]!.client = true
  group.target = {
    id: 'ground-1',
    type: 'Ground Group',
    objectiveId: 'objective-1'
  }
  return group
}

function createTaskFlightGroup(
  id: string,
  callsign: string,
  startTime: Date,
  task: FlightGroup['task']
): FlightGroup {
  const group = createFlightGroup(id, callsign, startTime)
  group.task = task
  group.flightplan.waypoints[1] = {
    ...group.flightplan.waypoints[1]!,
    name: task,
    type: 'Task'
  }
  return group
}

function createCampaign(startTime: Date): Campaign {
  const createAircraftTypes = (): CampaignCoalition['aircraftTypes'] =>
    Object.fromEntries(
      schemas.task.options.map((task) => [task, [] as string[]])
    ) as unknown as CampaignCoalition['aircraftTypes']

  const createGroundUnitTypes = (): CampaignCoalition['groundUnitTypes'] =>
    Object.fromEntries(
      schemas.groundUnitType.options.map((type) => [type, [] as string[]])
    ) as unknown as CampaignCoalition['groundUnitTypes']

  const emptyCoalition: CampaignCoalition = {
    id: 'empty',
    aircraftTypes: createAircraftTypes(),
    groundUnitTypes: createGroundUnitTypes(),
    airdromeNames: [],
    objectiveIds: [],
    structures: [],
    samGroups: [],
    groundGroups: [],
    flightGroups: [],
    packages: []
  }

  return {
    version: 'test',
    id: 'campaign',
    name: 'Campaign',
    createdAt: startTime,
    updatedAt: startTime,
    time: startTime,
    timeMultiplier: 1,
    logs: [],
    scenarioId: 'scenario',
    coalitions: {
      player: {
        ...emptyCoalition,
        id: 'player',
        flightGroups: ['Enfield-1', 'Chevy-2', 'Ford-3', 'Colt-4', 'Uzi-5'].map((callsign, index) =>
          createFlightGroup(`blue-${index + 1}`, callsign, startTime)
        )
      },
      opponent: {
        ...emptyCoalition,
        id: 'opponent',
        flightGroups: [createFlightGroup('red-1', 'Springfield-1', startTime)]
      }
    }
  }
}

const theatre: Theatre = {
  name: 'Caucasus',
  objectives: [],
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getStationNumber(unit: AircraftUnit): unknown {
  const addPropAircraft = unit.AddPropAircraft as unknown
  if (!isRecord(addPropAircraft)) return undefined

  return addPropAircraft.STN_L16
}

function getLink16Network(unit: AircraftUnit): { teamMembers: unknown; donors: unknown } {
  const datalinks = unit.datalinks as unknown
  expect(isRecord(datalinks)).toBe(true)
  if (!isRecord(datalinks)) throw new Error('expected datalinks record')

  const link16 = datalinks.Link16
  expect(isRecord(link16)).toBe(true)
  if (!isRecord(link16)) throw new Error('expected Link16 record')

  const network = link16.network
  expect(isRecord(network)).toBe(true)
  if (!isRecord(network)) throw new Error('expected Link16 network record')

  return {
    teamMembers: network.teamMembers,
    donors: network.donors
  }
}

function getMissionUnitIds(entries: unknown): number[] {
  expect(Array.isArray(entries)).toBe(true)
  if (!Array.isArray(entries)) throw new Error('expected mission unit id entries')

  return entries.map((entry) => {
    expect(isRecord(entry)).toBe(true)
    if (!isRecord(entry)) throw new Error('expected mission unit id entry')

    expect(typeof entry.missionUnitId).toBe('number')
    return entry.missionUnitId as number
  })
}

describe('addFlightGroups carrier compatibility', () => {
  test('spawns carriers facing into the surface wind used by their startup route', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    mission.weather.wind.atGround = { speed: 9, dir: 170 }
    campaign.coalitions.player.navalGroups = [
      {
        id: 'uk-carrier-group',
        name: 'UK Carrier Group',
        role: 'carrier',
        unitTypes: ['hms_invincible'],
        position: { x: 1_000, y: 1_000 },
        heading: (270 * Math.PI) / 180,
        damage: 0,
        fuel: 1,
        ammunition: 1,
        cargo: 0,
        state: 'operational'
      }
    ]

    const result = addNavalGroups(mission, campaign)

    expect(result.isOk()).toBe(true)
    expect(mission.coalition.blue.country?.[0]?.ship?.group[0]?.units[0]?.heading).toBeCloseTo(
      (350 * Math.PI) / 180
    )
  })

  test.each([
    ['FA-18C_hornet', 'CVN_71'],
    ['AV8BNA', 'LHA_Tarawa']
  ] as const)(
    'links %s to a compatible ship in a mixed carrier group',
    (aircraftType, shipType) => {
      const startTime = new Date('2026-01-01T00:00:00Z')
      const mission = createMission()
      const campaign = createCampaign(startTime)
      const flightGroup = createFlightGroup('carrier-flight', 'Ford-1', startTime)
      flightGroup.homeBase = 'uk-carrier-group'
      flightGroup.aircrafts.forEach((aircraft) => {
        aircraft.aircraftName = aircraftType
      })
      campaign.coalitions.player.flightGroups = [flightGroup]
      campaign.coalitions.opponent.flightGroups = []
      campaign.coalitions.player.navalGroups = [
        {
          id: 'uk-carrier-group',
          name: 'UK Carrier Group',
          role: 'carrier',
          unitTypes: ['LHA_Tarawa', 'CVN_71'],
          units: [
            {
              id: 'tarawa',
              type: 'LHA_Tarawa',
              damage: 0,
              ammunition: 1,
              fuel: 1,
              state: 'operational'
            },
            {
              id: 'supercarrier',
              type: 'CVN_71',
              damage: 0,
              ammunition: 1,
              fuel: 1,
              state: 'operational'
            }
          ],
          position: { x: 1_000, y: 1_000 },
          heading: 0,
          damage: 0,
          fuel: 1,
          ammunition: 1,
          cargo: 0,
          state: 'operational'
        }
      ]

      const navalResult = addNavalGroups(mission, campaign)
      expect(navalResult.isOk()).toBe(true)
      if (navalResult.isErr()) throw navalResult.error

      const carrierMissionGroup = mission.coalition.blue.country?.[0]?.ship?.group[0]
      const expectedCarrier = carrierMissionGroup?.units.find((unit) => unit.type === shipType)
      expect(expectedCarrier).toBeDefined()

      const flightResult = addFlightGroups(mission, campaign, theatre)
      expect(flightResult.isOk()).toBe(true)
      if (flightResult.isErr()) throw flightResult.error

      const emittedFlight = mission.coalition.blue.country?.[0]?.plane?.group[0]
      expect(emittedFlight?.route?.points[0]?.helipadId).toBe(expectedCarrier?.unitId)
      expect(emittedFlight?.route?.points.at(-1)).toMatchObject({
        helipadId: expectedCarrier?.unitId,
        x: expectedCarrier?.x,
        y: expectedCarrier?.y
      })
      expect(emittedFlight?.units[0]).toMatchObject({
        x: expectedCarrier?.x,
        y: expectedCarrier?.y
      })
    }
  )
})

describe('addFlightGroups Link-16 output', () => {
  test('assigns unique friendly F-16 STNs and shares friendly flights through team members and donors', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const result = addFlightGroups(mission, createCampaign(startTime), theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const blueGroups = mission.coalition.blue.country?.[0]?.plane?.group ?? []
    const redGroups = mission.coalition.red.country?.[0]?.plane?.group ?? []
    const blueUnits = blueGroups.flatMap((group) => group.units)
    const redUnitIds = new Set(redGroups.flatMap((group) => group.units.map((unit) => unit.unitId)))

    expect(blueGroups[0]).toMatchObject({
      hiddenOnMFD: false,
      hiddenOnPlanner: false,
      taskSelected: true
    })

    const stationNumbers = blueUnits.map(getStationNumber)
    expect(stationNumbers).toEqual([
      '00201',
      '00202',
      '00301',
      '00302',
      '00401',
      '00402',
      '00501',
      '00502',
      '00601',
      '00602'
    ])
    expect(new Set(stationNumbers).size).toBe(stationNumbers.length)

    const firstUnit = blueUnits[0]
    expect(firstUnit).toBeDefined()
    if (!firstUnit) throw new Error('expected first blue unit')

    const firstNetwork = getLink16Network(firstUnit)
    const teamMemberIds = getMissionUnitIds(firstNetwork.teamMembers)
    const donorIds = getMissionUnitIds(firstNetwork.donors)

    expect(teamMemberIds).toEqual(blueUnits.slice(0, 8).map((unit) => unit.unitId))
    expect(donorIds).toEqual(blueUnits.slice(8, 10).map((unit) => unit.unitId))

    const blueNetworkIds = new Set([...teamMemberIds, ...donorIds])
    redUnitIds.forEach((unitId) => expect(blueNetworkIds.has(unitId)).toBe(false))
  })
})

describe('addFlightGroups parking assignment', () => {
  test('skips blocked parking stands', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    campaign.coalitions.player.flightGroups = [createFlightGroup('blue-1', 'Enfield-1', startTime)]
    campaign.coalitions.opponent.flightGroups = []

    const theatreWithParking: Theatre = {
      ...theatre,
      airdromeDetails: {
        'Test Base': {
          id: 1,
          name: 'Test Base',
          x: 1000,
          y: 1000,
          runwayAngle: 90,
          standlist: {
            '01': {
              id: '01',
              crossroad_index: 1,
              helicopter: true,
              large: true,
              plane: true,
              shelter: false,
              x: 100,
              y: 100,
              blocked: true
            },
            '02': {
              id: '02',
              crossroad_index: 2,
              helicopter: true,
              large: true,
              plane: true,
              shelter: false,
              x: 200,
              y: 200
            },
            '03': {
              id: '03',
              crossroad_index: 3,
              helicopter: true,
              large: true,
              plane: true,
              shelter: false,
              x: 300,
              y: 300
            }
          }
        }
      }
    }

    const result = addFlightGroups(mission, campaign, theatreWithParking)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const units = mission.coalition.blue.country?.[0]?.plane?.group?.[0]?.units ?? []

    expect(units.map((unit) => unit.parking_id)).toEqual(['02', '03'])
    expect(units.map((unit) => unit.parking)).toEqual(['2', '3'])
  })

  test('assigns native FARP parking slots across client helicopter groups', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    mission.coalition.blue.country![0]!.static = {
      group: [
        {
          groupId: 700,
          name: 'Static-farp-1-Farp-700',
          heading: 0,
          x: 1000,
          y: 1000,
          units: [
            {
              unitId: 701,
              name: 'Static-farp-1-Farp-700-1',
              x: 1000,
              y: 1000,
              type: 'FARP',
              heading: 0,
              category: 'Heliports'
            }
          ]
        }
      ]
    }
    const campaign = createCampaign(startTime)
    const firstGroup = createTaskFlightGroup('blue-csar-1', 'Enfield-1', startTime, 'CSAR')
    const secondGroup = createTaskFlightGroup('blue-csar-2', 'Springfield-1', startTime, 'CSAR')

    for (const [index, group] of [firstGroup, secondGroup].entries()) {
      group.aircrafts = [
        {
          id: `blue-csar-${index + 1}-1`,
          unitName: `${group.callsign}-1`,
          aircraftName: index === 0 ? 'CH-47Fbl1' : 'UH-1H',
          client: true
        }
      ]
      group.homeBase = 'farp-1'
      group.position = { x: 1000, y: 1000 }
      group.flightplan.waypoints[0]!.position = group.position
      group.flightplan.waypoints[2]!.position = group.position
    }

    campaign.coalitions.player.structures = [
      {
        id: 'farp-1',
        type: 'Farp',
        objectiveId: 'objective-1',
        position: { x: 1000, y: 1000 },
        name: 'Forward FARP',
        resources: 0,
        buildings: [{ type: 'FARP', offset: { x: 0, y: 0 }, alive: true }]
      }
    ]
    campaign.coalitions.player.flightGroups = [firstGroup, secondGroup]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const groups = mission.coalition.blue.country?.[0]?.helicopter?.group ?? []
    expect(groups.map((group) => group.units[0]?.parking_id)).toEqual(['1', '2'])
    expect(groups.map((group) => group.units[0]?.parking)).toEqual(['1', '2'])
    expect(groups[0]?.units[0]?.AddPropAircraft).toEqual({
      DustProtectionDevices: false,
      NetCrewControlPriority: 0
    })
    expect(groups.map((group) => group.route?.points[0])).toEqual([
      expect.objectContaining({
        x: 1000,
        y: 1000,
        type: 'TakeOffParking',
        helipadId: 701,
        linkUnit: 701
      }),
      expect.objectContaining({
        x: 1000,
        y: 1000,
        type: 'TakeOffParking',
        helipadId: 701,
        linkUnit: 701
      })
    ])
    expect(groups.map((group) => group.route?.points.at(-1))).toEqual([
      expect.objectContaining({
        x: 1000,
        y: 1000,
        type: 'Land',
        helipadId: 701,
        linkUnit: 701
      }),
      expect.objectContaining({
        x: 1000,
        y: 1000,
        type: 'Land',
        helipadId: 701,
        linkUnit: 701
      })
    ])
  })
})

describe('addFlightGroups airborne client spawn altitude', () => {
  test('spawns airborne fixed-wing groups at least 10000 feet above ground-level interpolation', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    const group = createFlightGroup('blue-airborne', 'Enfield-1', startTime)
    group.aircrafts[0]!.client = true
    campaign.time = new Date(startTime.getTime() + 10 * 60 * 1000)
    campaign.coalitions.player.flightGroups = [group]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const emittedGroup = mission.coalition.blue.country?.[0]?.plane?.group?.[0]
    const firstUnit = emittedGroup?.units[0]
    const currentRoutePoint = emittedGroup?.route?.points[0]

    expect(firstUnit?.alt).toBeCloseTo(3048)
    expect(firstUnit?.parking).toBeUndefined()
    expect(currentRoutePoint).toMatchObject({
      alt: 3048,
      type: 'Turning Point',
      action: 'Turning Point',
      name: 'Current'
    })
  })

  test('spawns airborne helicopter groups at least 200 feet above ground-level interpolation', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    const group = createFlightGroup('blue-heli-airborne', 'Enfield-1', startTime)
    group.task = 'Transport'
    group.aircrafts.forEach((aircraft) => {
      aircraft.aircraftName = 'UH-60L'
    })
    group.aircrafts[0]!.client = true
    campaign.time = new Date(startTime.getTime() + 10 * 60 * 1000)
    campaign.coalitions.player.flightGroups = [group]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const emittedGroup = mission.coalition.blue.country?.[0]?.helicopter?.group?.[0]
    const firstUnit = emittedGroup?.units[0]
    const currentRoutePoint = emittedGroup?.route?.points[0]

    expect(firstUnit?.alt).toBeCloseTo(60.96)
    expect(firstUnit?.parking).toBeUndefined()
    expect(currentRoutePoint).toMatchObject({
      alt: 60.96,
      type: 'Turning Point',
      action: 'Turning Point',
      name: 'Current'
    })
  })
})

describe('addFlightGroups enemy traffic throttle', () => {
  test('randomly samples opponent non-CAP flights when no player client CAP is selected', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    campaign.coalitions.player.flightGroups = [
      createTaskFlightGroup('blue-cas', 'Enfield-1', startTime, 'CAS')
    ]
    campaign.coalitions.opponent.flightGroups = [
      createTaskFlightGroup('red-cap', 'Springfield-1', startTime, 'CAP'),
      ...Array.from({ length: 9 }, (_, index) =>
        createTaskFlightGroup(
          `red-strike-${index + 1}`,
          `Bandit-${index + 1}`,
          startTime,
          'Pinpoint Strike'
        )
      )
    ]

    const randomSpy = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.9)

    const result = addFlightGroups(mission, campaign, theatre)
    randomSpy.mockRestore()

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const redGroups = mission.coalition.red.country?.[0]?.plane?.group ?? []
    expect(redGroups.map((group) => group.name)).toEqual([
      'Springfield-1',
      'Bandit-2',
      'Bandit-4',
      'Bandit-6'
    ])
  })

  test('always includes opponent strategic strike flights when enemy traffic is throttled', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    campaign.coalitions.player.flightGroups = [
      createTaskFlightGroup('blue-cas', 'Enfield-1', startTime, 'CAS')
    ]
    campaign.coalitions.opponent.flightGroups = [
      createTaskFlightGroup('red-strategic', 'Buff-1', startTime, 'Strategic Strike'),
      createTaskFlightGroup('red-strike', 'Bandit-1', startTime, 'Pinpoint Strike')
    ]

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9)

    const result = addFlightGroups(mission, campaign, theatre)
    randomSpy.mockRestore()

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const redGroups = mission.coalition.red.country?.[0]?.plane?.group ?? []
    expect(redGroups.map((group) => group.name)).toEqual(['Buff-1'])
  })

  test('includes all opponent flights when a player client CAP is selected', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    const clientCap = createTaskFlightGroup('blue-cap', 'Enfield-1', startTime, 'CAP')
    clientCap.aircrafts[0]!.client = true
    campaign.coalitions.player.flightGroups = [clientCap]
    campaign.coalitions.opponent.flightGroups = [
      createTaskFlightGroup('red-cap', 'Springfield-1', startTime, 'CAP'),
      ...Array.from({ length: 9 }, (_, index) =>
        createTaskFlightGroup(
          `red-strike-${index + 1}`,
          `Bandit-${index + 1}`,
          startTime,
          'Pinpoint Strike'
        )
      )
    ]

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const redGroups = mission.coalition.red.country?.[0]?.plane?.group ?? []
    expect(redGroups.map((group) => group.name)).toEqual([
      'Springfield-1',
      'Bandit-1',
      'Bandit-2',
      'Bandit-3',
      'Bandit-4',
      'Bandit-5',
      'Bandit-6',
      'Bandit-7',
      'Bandit-8',
      'Bandit-9'
    ])
  })
})

describe('addFlightGroups mission script config', () => {
  test('sets a single selected client aircraft to client skill', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    const clientGroup = createFlightGroup('blue-client', 'Enfield-1', startTime)
    clientGroup.aircrafts[0]!.client = true
    campaign.coalitions.player.flightGroups = [clientGroup]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const units = mission.coalition.blue.country?.[0]?.plane?.group?.[0]?.units ?? []

    expect(units.map((unit) => unit.skill)).toEqual(['Client', 'High'])
  })

  test('keeps multiple selected client aircraft as client skill', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    const clientGroup = createFlightGroup('blue-client', 'Enfield-1', startTime)
    clientGroup.aircrafts[0]!.client = true
    clientGroup.aircrafts[1]!.client = true
    campaign.coalitions.player.flightGroups = [clientGroup]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const units = mission.coalition.blue.country?.[0]?.plane?.group?.[0]?.units ?? []

    expect(units.map((unit) => unit.skill)).toEqual(['Client', 'Client'])
  })

  test('keeps separate selected client flight groups as client skill', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    const firstClientGroup = createFlightGroup('blue-client-1', 'Enfield-1', startTime)
    const secondClientGroup = createFlightGroup('blue-client-2', 'Springfield-1', startTime)
    firstClientGroup.aircrafts[0]!.client = true
    secondClientGroup.aircrafts[0]!.client = true
    campaign.coalitions.player.flightGroups = [firstClientGroup, secondClientGroup]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const groups = mission.coalition.blue.country?.[0]?.plane?.group ?? []

    expect(groups.map((group) => group.units?.map((unit) => unit.skill))).toEqual([
      ['Client', 'High'],
      ['Client', 'High']
    ])
  })

  test('uses a UHF flight group frequency accepted by DCS aircraft radios', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    campaign.coalitions.player.flightGroups = [
      createFlightGroup('blue-client', 'Springfield-4', startTime)
    ]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const group = mission.coalition.blue.country?.[0]?.plane?.group?.[0]

    expect(group?.frequency).toBe(251)
  })

  test('uses the aircraft payload ammo type when generating units', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    const group = createFlightGroup('blue-f100', 'Enfield-1', startTime)
    group.aircrafts.forEach((aircraft) => {
      aircraft.aircraftName = 'F-100D'
    })
    campaign.coalitions.player.flightGroups = [group]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const units = mission.coalition.blue.country?.[0]?.plane?.group?.[0]?.units ?? []
    expect(units.map((unit) => unit.payload?.ammo_type)).toEqual([2, 2])
  })

  test('equips Harrier DEAD flights with anti-radiation and strike weapons', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    const group = createTaskFlightGroup('blue-harrier-dead', 'Enfield-1', startTime, 'DEAD')
    group.aircrafts.forEach((aircraft) => {
      aircraft.aircraftName = 'AV8BNA'
    })
    campaign.coalitions.player.flightGroups = [group]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const units = mission.coalition.blue.country?.[0]?.plane?.group?.[0]?.units ?? []
    expect(units).toHaveLength(2)
    expect(units[0]?.payload?.pylons).toEqual({
      1: { CLSID: '{AGM_122_SIDEARM}', num: 1 },
      2: { CLSID: '{LAU_7_AGM_122_SIDEARM}', num: 2 },
      3: { CLSID: 'LAU_117_AGM_65F', num: 3 },
      4: { CLSID: '{GAU_12_Equalizer}', num: 4 },
      5: { CLSID: '{ALQ_164_RF_Jammer}', num: 5 },
      6: { CLSID: 'LAU_117_AGM_65F', num: 6 },
      7: { CLSID: '{LAU_7_AGM_122_SIDEARM}', num: 7 },
      8: { CLSID: '{AGM_122_SIDEARM}', num: 8 }
    })
  })

  test('equips Harrier CAS flights with air-to-ground weapons and a targeting pod', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    const group = createTaskFlightGroup('blue-harrier-cas', 'Enfield-1', startTime, 'CAS')
    group.aircrafts.forEach((aircraft) => {
      aircraft.aircraftName = 'AV8BNA'
    })
    campaign.coalitions.player.flightGroups = [group]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const units = mission.coalition.blue.country?.[0]?.plane?.group?.[0]?.units ?? []
    expect(units).toHaveLength(2)
    expect(units[0]?.payload?.pylons).toEqual({
      1: { CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}', num: 1 },
      2: { CLSID: '{DB769D48-67D7-42ED-A2BE-108D566C8B1E}', num: 2 },
      3: { CLSID: 'LAU_117_AGM_65F', num: 3 },
      4: { CLSID: '{GAU_12_Equalizer}', num: 4 },
      5: { CLSID: '{A111396E-D3E8-4b9c-8AC9-2432489304D5}', num: 5 },
      6: { CLSID: 'LAU_117_AGM_65F', num: 6 },
      7: { CLSID: '{DB769D48-67D7-42ED-A2BE-108D566C8B1E}', num: 7 },
      8: { CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}', num: 8 }
    })
  })

  test('assigns a unique radio frequency to each generated flight group', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const groups = mission.coalition.blue.country?.[0]?.plane?.group ?? []
    const frequencies = groups.map((group) => group.frequency)

    expect(frequencies).toEqual([251, 251.05, 251.1, 251.15, 251.2])
    expect(new Set(frequencies).size).toBe(frequencies.length)
  })

  test('assigns constrained aircraft frequencies inside their allowed range', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    const firstGroup = createFlightGroup('blue-mig-1', 'Enfield-1', startTime)
    const secondGroup = createFlightGroup('blue-mig-2', 'Springfield-1', startTime)
    firstGroup.aircrafts.forEach((aircraft) => {
      aircraft.aircraftName = 'MiG-21Bis'
    })
    secondGroup.aircrafts.forEach((aircraft) => {
      aircraft.aircraftName = 'MiG-21Bis'
    })
    campaign.coalitions.player.flightGroups = [firstGroup, secondGroup]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const groups = mission.coalition.blue.country?.[0]?.plane?.group ?? []
    const frequencies = groups.map((group) => group.frequency)

    expect(frequencies).toEqual([118, 118.05])
    frequencies.forEach((frequency) => {
      expect(frequency).toBeGreaterThanOrEqual(118)
      expect(frequency).toBeLessThanOrEqual(140)
    })
    expect(new Set(frequencies).size).toBe(frequencies.length)
  })

  test('returns client flight unit names for mission scripts', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    const clientGroup = createFlightGroup('blue-client', 'Enfield-1', startTime)
    clientGroup.aircrafts[0]!.client = true
    campaign.coalitions.player.flightGroups = [clientGroup]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    expect(result.value[0]?.groupId).toEqual(expect.any(Number))
    expect(result.value.map(({ groupId: _groupId, ...group }) => group)).toEqual([
      {
        name: 'Enfield-1',
        task: 'CAP',
        unitNames: ['Enfield-1-1', 'Enfield-1-2']
      }
    ])
  })

  test('returns downed pilot details for client CSAR mission commands', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    const clientGroup = createTaskFlightGroup('blue-csar', 'Enfield-1', startTime, 'CSAR')
    clientGroup.aircrafts = [
      {
        id: 'blue-csar-1',
        unitName: 'Enfield-1-1',
        aircraftName: 'UH-1H',
        client: true
      }
    ]
    clientGroup.target = {
      id: 'pilot-1',
      type: 'Downed Pilot',
      objectiveId: 'objective-1'
    }
    clientGroup.flightplan.waypoints.splice(-1, 0, {
      name: 'Drop Off',
      position: { x: 1500, y: 1600 },
      altitude: 30,
      speed: 70,
      type: 'Nav'
    })
    campaign.coalitions.player.downedPilots = [
      {
        id: 'pilot-1',
        name: 'Pilot 1',
        position: { x: 3000, y: 4000 },
        ejectedAt: startTime
      }
    ]
    campaign.coalitions.player.flightGroups = [clientGroup]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, theatre)

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error
    expect(result.value[0]).toMatchObject({
      name: 'Enfield-1',
      task: 'CSAR',
      isHelicopter: true,
      csar: {
        pilotId: 'pilot-1',
        pilotName: 'Pilot 1',
        position: { x: 3000, y: 4000 },
        dropOffPosition: { x: 1500, y: 1600 },
        pickupRadius: 150
      }
    })
    expect(
      mission.coalition.blue.country?.[0]?.helicopter?.group?.[0]?.route?.points[0]
    ).toMatchObject({
      action: 'From Ground Area',
      type: 'TakeOffGround'
    })
    expect(mission.coalition.blue.country?.[0]?.helicopter?.group?.[0]?.task).toBe('Transport')
  })

  test('skips CAS JTAC support when disabled in campaign params', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    campaign.campaignParams = { casJtac: false }
    campaign.coalitions.player.flightGroups = [createClientCasFlightGroup(startTime)]
    campaign.coalitions.opponent.flightGroups = []
    campaign.coalitions.opponent.groundGroups = [
      {
        id: 'ground-1',
        units: [],
        position: { x: 3000, y: 3000 },
        objectiveId: 'objective-1',
        state: 'idle'
      }
    ]

    const result = addFlightGroups(mission, campaign, {
      ...theatre,
      objectives: [{ name: 'objective-1', type: 'Frontline', position: { x: 3000, y: 3000 } }]
    })

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    const blueGroups = mission.coalition.blue.country?.[0]?.plane?.group ?? []
    expect(blueGroups.map((group) => group.name)).toEqual(['Enfield-1'])
    expect(result.value[0]?.groupId).toEqual(expect.any(Number))
    expect(result.value.map(({ groupId: _groupId, ...group }) => group)).toEqual([
      {
        name: 'Enfield-1',
        navigation: {
          mode: 'targetVector',
          targetLabel: 'Ground Group objective-1',
          targetPoint: {
            x: 3000,
            z: 3000
          }
        },
        task: 'CAS',
        unitNames: ['Enfield-1-1', 'Enfield-1-2']
      }
    ])
  })

  test('adds target vector navigation config for client flights with assigned targets', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    campaign.campaignParams = { navigationAid: 'targetVector' }
    const clientGroup = createFlightGroup('blue-client', 'Enfield-1', startTime)
    clientGroup.aircrafts[0]!.client = true
    clientGroup.target = {
      id: 'objective-1',
      objectiveId: 'objective-1',
      type: 'Structure'
    }
    campaign.coalitions.player.flightGroups = [clientGroup]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, {
      ...theatre,
      objectives: [{ name: 'objective-1', type: 'Frontline', position: { x: 3000, y: 4000 } }]
    })

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    expect(result.value[0]).toMatchObject({
      name: 'Enfield-1',
      navigation: {
        mode: 'targetVector',
        targetLabel: 'Structure objective-1',
        targetPoint: {
          x: 3000,
          z: 4000
        }
      }
    })
  })

  test('adds hidden target TACAN beacon and channel config for target TACAN mode', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    campaign.campaignParams = { navigationAid: 'targetTacan' }
    const clientGroup = createFlightGroup('blue-client', 'Enfield-1', startTime)
    clientGroup.aircrafts[0]!.client = true
    clientGroup.target = {
      id: 'objective-1',
      objectiveId: 'objective-1',
      type: 'Structure'
    }
    campaign.coalitions.player.flightGroups = [clientGroup]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, {
      ...theatre,
      objectives: [{ name: 'objective-1', type: 'Frontline', position: { x: 3000, y: 4000 } }]
    })

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    expect(result.value[0]).toMatchObject({
      navigation: {
        mode: 'targetTacan',
        tacan: {
          channel: 31,
          band: 'X',
          callsign: 'DCC1'
        }
      }
    })

    const beaconGroup = mission.coalition.blue.country?.[0]?.vehicle?.group?.[0]
    expect(beaconGroup).toMatchObject({
      hidden: true,
      visible: false,
      x: 3500,
      y: 4500,
      units: [
        {
          type: 'TACAN_beacon',
          x: 3500,
          y: 4500
        }
      ]
    })

    const beaconRouteTask = JSON.stringify(beaconGroup?.route?.points[0]?.task)
    expect(beaconRouteTask).toContain('"id":"SetImmortal"')
    expect(beaconRouteTask).toContain('"id":"SetInvisible"')
    expect(beaconRouteTask).toContain('"id":"ActivateBeacon"')
    expect(beaconRouteTask).toContain('"channel":31')
    expect(beaconRouteTask).toContain('"callsign":"DCC1"')
    expect(beaconRouteTask).toContain('"unitId"')
    expect(beaconRouteTask).toContain('"system":18')
    expect(beaconRouteTask).toContain('"frequency":992000000')
  })

  test('can enable F10 vectors and target TACAN together', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    campaign.campaignParams = {
      navigationVectors: true,
      navigationTargetTacan: true
    }
    const clientGroup = createFlightGroup('blue-client', 'Enfield-1', startTime)
    clientGroup.aircrafts[0]!.client = true
    clientGroup.homeBase = 'Test Base'
    clientGroup.target = {
      id: 'objective-1',
      objectiveId: 'objective-1',
      type: 'Structure'
    }
    campaign.coalitions.player.flightGroups = [clientGroup]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, {
      ...theatre,
      airdromeDetails: {
        'Test Base': {
          id: 1,
          name: 'Test Base',
          x: 1200,
          y: 3400,
          runwayAngle: 0,
          standlist: {},
          tacan: { channel: 67, band: 'X', callsign: 'TST' }
        }
      },
      objectives: [{ name: 'objective-1', type: 'Frontline', position: { x: 3000, y: 4000 } }]
    })

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    expect(result.value[0]).toMatchObject({
      navigation: {
        mode: 'targetTacan',
        targetLabel: 'Structure objective-1',
        targetPoint: {
          x: 3000,
          z: 4000
        },
        landingLabel: 'Test Base',
        landingPoint: {
          x: 1200,
          z: 3400
        },
        landingTacan: {
          channel: 67,
          band: 'X',
          callsign: 'TST'
        },
        tacan: {
          channel: 31,
          band: 'X',
          callsign: 'DCC1'
        }
      }
    })
    expect(mission.coalition.blue.country?.[0]?.vehicle?.group).toHaveLength(1)
  })

  test('adds landing airport navigation config for client flights', () => {
    const startTime = new Date('2026-01-01T00:00:00Z')
    const mission = createMission()
    const campaign = createCampaign(startTime)
    campaign.campaignParams = { navigationAid: 'landingAirport' }
    const clientGroup = createFlightGroup('blue-client', 'Enfield-1', startTime)
    clientGroup.aircrafts[0]!.client = true
    clientGroup.homeBase = 'Test Base'
    campaign.coalitions.player.flightGroups = [clientGroup]
    campaign.coalitions.opponent.flightGroups = []

    const result = addFlightGroups(mission, campaign, {
      ...theatre,
      airdromeDetails: {
        'Test Base': {
          id: 1,
          name: 'Test Base',
          x: 1200,
          y: 3400,
          runwayAngle: 0,
          standlist: {},
          tacan: { channel: 67, band: 'X', callsign: 'TST' }
        }
      }
    })

    expect(result.isOk()).toBe(true)
    if (result.isErr()) throw result.error

    expect(result.value[0]).toMatchObject({
      name: 'Enfield-1',
      navigation: {
        mode: 'landingAirport',
        landingLabel: 'Test Base',
        landingPoint: {
          x: 1200,
          z: 3400
        },
        landingTacan: {
          channel: 67,
          band: 'X',
          callsign: 'TST'
        }
      }
    })
  })
})
