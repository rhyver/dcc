import { schemas } from '@dcc/contracts'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'

import { addFlightGroups } from './add-flight-groups'

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
})

describe('addFlightGroups mission script config', () => {
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

    expect(result.value).toEqual([
      {
        groupId: expect.any(Number),
        name: 'Enfield-1',
        task: 'CAP',
        unitNames: ['Enfield-1-1', 'Enfield-1-2']
      }
    ])
  })
})
