import { ensurePersistentGciEwrs } from '@dcc/campaign'
import { schemas } from '@dcc/contracts'
import {
  FULCRUM_AIRCRAFT_NAME,
  GCI_STATION_TYPE,
  isNativeGciEnabled,
  planCampaignGciStations,
  planGciStationsForAirdromes
} from '@dcc/data'
import AdmZip from 'adm-zip'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'

import { addFlightGroups } from './add-flight-groups'
import { addGciStations, configureNativeGci } from './add-gci'
import { buildIadsConfig } from './iads'
import { generateMizFromCampaign } from './index'
import { renderKneeboardSvg } from './kneeboard'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Mission = z.infer<typeof schemas.dcs.mission>
type Theatre = z.infer<typeof schemas.theatre>

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
    coalitions: { neutrals: [], blue: [0], red: [2] },
    coalition: {
      neutrals: { bullseye: { x: 0, y: 0 }, nav_points: [], name: 'neutrals', country: [] },
      blue: {
        bullseye: { x: 0, y: 0 },
        nav_points: [],
        name: 'blue',
        country: [{ id: 0, name: 'Russia', vehicle: { group: [] } }]
      },
      red: {
        bullseye: { x: 0, y: 0 },
        nav_points: [],
        name: 'red',
        country: [{ id: 2, name: 'USA', vehicle: { group: [] } }]
      }
    },
    result: { total: 0, offline: {}, blue: {}, red: {} }
  }
}

function createTheatre(): Theatre {
  return {
    name: 'Caucasus',
    objectives: [],
    targets: {},
    airdromeDetails: {
      'Test Base': {
        id: 1,
        name: 'Test Base',
        x: 4000,
        y: 5000,
        runwayAngle: 0,
        standlist: {}
      }
    },
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
}

function createCampaign(): Campaign {
  const createAircraftTypes = (): Campaign['coalitions']['player']['aircraftTypes'] =>
    Object.fromEntries(
      schemas.task.options.map((task) => [task, [] as string[]])
    ) as unknown as Campaign['coalitions']['player']['aircraftTypes']

  const createGroundUnitTypes = (): Campaign['coalitions']['player']['groundUnitTypes'] =>
    Object.fromEntries(
      schemas.groundUnitType.options.map((type) => [type, [] as string[]])
    ) as unknown as Campaign['coalitions']['player']['groundUnitTypes']

  const emptyCoalition = {
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

  const startTime = new Date('2026-01-01T00:00:00Z')
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
        airdromeNames: ['Test Base'],
        flightGroups: [
          {
            id: 'fulcrum-1',
            aircrafts: [
              {
                id: 'fulcrum-1-1',
                unitName: 'Enfield-1-1',
                aircraftName: FULCRUM_AIRCRAFT_NAME,
                client: true
              }
            ],
            task: 'CAP',
            position: { x: 1000, y: 1000 },
            homeBase: 'Test Base',
            callsign: 'Enfield-1',
            flightplan: {
              id: 'fulcrum-1-plan',
              startTime,
              waypoints: [
                {
                  name: 'Take Off',
                  position: { x: 1000, y: 1000 },
                  altitude: 0,
                  speed: 150,
                  type: 'TakeOff'
                }
              ]
            }
          }
        ]
      },
      opponent: { ...emptyCoalition, id: 'opponent' }
    }
  }
}

function addField(theatre: Theatre, name: string, x: number) {
  theatre.airdromeDetails[name] = {
    id: Object.keys(theatre.airdromeDetails).length + 1,
    name,
    x,
    y: 5000,
    runwayAngle: 0,
    standlist: {}
  }
}

describe('native KRU GCI networks', () => {
  test('gives the owned home field WAVE 1 and the opponent a separate channel range', () => {
    const campaign = createCampaign()
    const theatre = createTheatre()
    addField(theatre, 'Far Base', 300_000)
    addField(theatre, 'Enemy Base', 600_000)
    campaign.coalitions.player.airdromeNames = ['Far Base', 'Test Base']
    campaign.coalitions.opponent.airdromeNames = ['Enemy Base']
    const planned = planCampaignGciStations(campaign, theatre)
    expect(planned.player.map((station) => [station.airdromeName, station.channel])).toEqual([
      ['Test Base', 1],
      ['Far Base', 2]
    ])
    expect(planned.opponent[0]).toMatchObject({
      coalition: 'opponent',
      channel: 11,
      airdromeName: 'Enemy Base'
    })
    expect(
      planGciStationsForAirdromes(theatre, ['Far Base'], {
        coalition: 'player',
        preferredAirdrome: 'Test Base'
      }).map((station) => station.airdromeName)
    ).toEqual(['Far Base'])
  })

  test('caps each side at ten stations and deduplicates neighboring airfields', () => {
    const theatre = createTheatre()
    for (let index = 0; index < 24; index++) addField(theatre, `Base ${index}`, index * 150_000)
    const names = Object.keys(theatre.airdromeDetails)
    const stations = planGciStationsForAirdromes(theatre, names, {
      coalition: 'opponent',
      channelOffset: 10,
      maxStations: 50
    })
    expect(stations).toHaveLength(10)
    expect(stations.map((station) => station.channel)).toEqual([
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20
    ])
    expect(
      stations.filter((station) => ['Test Base', 'Base 0'].includes(station.airdromeName))
    ).toHaveLength(1)
  })

  test('emits the ActivateGCI task with the station unit ID, channel and range', () => {
    const campaign = createCampaign()
    const mission = createMission()
    const theatre = createTheatre()
    ensurePersistentGciEwrs(campaign, theatre)
    const stations = addGciStations(mission, campaign, theatre)
    expect(stations[0]).toMatchObject({ channel: 1, position: { x: 4400, y: 5000 } })
    const group = mission.coalition.blue.country?.[0]?.vehicle?.group.find(
      (group) => group.units[0]?.type === GCI_STATION_TYPE
    )
    expect(group?.route?.points[0]?.task).toMatchObject({
      id: 'ComboTask',
      params: {
        tasks: [
          {
            params: {
              action: {
                id: 'ActivateGCI',
                params: { channel: 1, radius: 200_000, x: 0, y: 0, unitId: group?.units[0]?.unitId }
              }
            }
          }
        ]
      }
    })
    expect(
      mission.coalition.blue.country?.[0]?.vehicle?.group.filter(
        (group) => group.units[0]?.type === '55G6 EWR'
      )
    ).toHaveLength(3)
  })

  test.each([
    { aircraftName: FULCRUM_AIRCRAFT_NAME, client: true, gci: undefined, enabled: true },
    { aircraftName: FULCRUM_AIRCRAFT_NAME, client: true, gci: true, enabled: true },
    { aircraftName: FULCRUM_AIRCRAFT_NAME, client: true, gci: false, enabled: false },
    { aircraftName: FULCRUM_AIRCRAFT_NAME, client: false, gci: true, enabled: false },
    { aircraftName: 'MiG-29A', client: true, gci: true, enabled: false },
    { aircraftName: 'F-16C_50', client: true, gci: undefined, enabled: false }
  ] as const)(
    'resolves native GCI for $aircraftName client=$client, gci=$gci to $enabled',
    ({ aircraftName, client, gci, enabled }) => {
      const campaign = createCampaign()
      campaign.coalitions.player.flightGroups[0]!.aircrafts[0] = {
        ...campaign.coalitions.player.flightGroups[0]!.aircrafts[0]!,
        aircraftName,
        client
      }
      campaign.campaignParams = { gci, ewr: false, iads: false }
      expect(isNativeGciEnabled(campaign)).toBe(enabled)
      expect(planCampaignGciStations(campaign, createTheatre()).player).toHaveLength(
        enabled ? 1 : 0
      )
    }
  )

  test('omits both KRU networks and reserve radars without a Fulcrum client', () => {
    const campaign = createCampaign()
    const theatre = createTheatre()
    addField(theatre, 'Enemy Base', 400_000)
    campaign.coalitions.opponent.airdromeNames = ['Enemy Base']
    campaign.coalitions.player.flightGroups[0]!.aircrafts[0]!.aircraftName = 'MiG-29A'
    expect(
      addGciStations(createMission(), campaign, theatre).map((station) => station.coalition)
    ).toEqual([])
    campaign.campaignParams = { ewr: false }
    ensurePersistentGciEwrs(campaign, theatre)
    expect(
      addGciStations(createMission(), campaign, theatre).map((station) => station.coalition)
    ).toEqual([])
    expect(campaign.coalitions.opponent.ewrGroups).toBeUndefined()
    expect(campaign.coalitions.opponent.gciRadarSites).toBeUndefined()
    expect(campaign.coalitions.player.ewrGroups).toBeUndefined()
  })

  test('disabling GCI preserves reserve radar losses without exporting them through IADS', () => {
    const campaign = createCampaign()
    const theatre = createTheatre()
    addField(theatre, 'Enemy Base', 400_000)
    campaign.coalitions.opponent.airdromeNames = ['Enemy Base']
    ensurePersistentGciEwrs(campaign, theatre)
    campaign.coalitions.player.ewrGroups![0]!.destroyed = true
    const savedRadars = structuredClone(campaign.coalitions)

    campaign.campaignParams = { gci: false, iads: true }
    const reloaded = schemas.campaign.campaign.parse(campaign)
    ensurePersistentGciEwrs(reloaded, theatre)
    const mission = createMission()
    expect(addGciStations(mission, reloaded, theatre)).toEqual([])
    expect(buildIadsConfig(mission, reloaded)).toBeNull()
    expect(mission.coalition.blue.country?.[0]?.vehicle?.group).toEqual([])
    expect(mission.coalition.red.country?.[0]?.vehicle?.group).toEqual([])
    expect(reloaded.coalitions).toEqual(savedRadars)

    reloaded.campaignParams!.gci = true
    ensurePersistentGciEwrs(reloaded, theatre)
    expect(addGciStations(createMission(), reloaded, theatre)).toHaveLength(2)
    expect(reloaded.coalitions).toEqual(savedRadars)
  })

  test('keeps the enemy network on the opponent side with the configured AI skill', () => {
    const campaign = createCampaign()
    campaign.playerSide = 'red'
    campaign.coalitions.player.countryName = 'Russia'
    campaign.coalitions.opponent.countryName = 'USA'
    campaign.campaignParams = { enemySkill: 'Average', culling: true }
    const theatre = createTheatre()
    addField(theatre, 'Enemy Base', 500_000)
    campaign.coalitions.opponent.airdromeNames = ['Enemy Base']
    ensurePersistentGciEwrs(campaign, theatre)
    const mission = createMission()
    addGciStations(mission, campaign, theatre)
    const enemyUnits = mission.coalition.red.country?.[0]?.vehicle?.group.flatMap(
      (group) => group.units
    )
    expect(enemyUnits?.map((unit) => unit.type)).toEqual([
      'FPS-117',
      'FPS-117',
      'FPS-117',
      GCI_STATION_TYPE
    ])
    expect(enemyUnits?.every((unit) => unit.skill === 'Average')).toBe(true)
    expect(mission.coalition.blue.country?.[0]?.vehicle?.group.at(-1)?.units[0]?.skill).toBe('High')
  })

  test('reuses living IADS EWRs without emitting a second copy', () => {
    const campaign = createCampaign()
    const theatre = createTheatre()
    campaign.coalitions.opponent.airdromeNames = ['Test Base']
    campaign.coalitions.opponent.ewrGroups = [
      { id: 'existing', type: '1L13 EWR', objectiveId: 'Test Base', position: { x: 4000, y: 5000 } }
    ]
    ensurePersistentGciEwrs(campaign, theatre)
    expect(campaign.coalitions.opponent.ewrGroups).toHaveLength(1)
    const mission = createMission()
    buildIadsConfig(mission, campaign)
    addGciStations(mission, campaign, theatre)
    expect(
      mission.coalition.red.country?.[0]?.vehicle?.group.filter(
        (group) => group.units[0]?.type === '1L13 EWR'
      )
    ).toHaveLength(1)
  })

  test.each([
    ['1L13 EWR', 4000, false, 1],
    ['1L13 EWR', 4000, true, 1],
    ['1L13 EWR', 400_000, false, 4],
    ['p-19 s-125 sr', 4000, false, 4]
  ] as const)(
    'respects %s at x=%i, destroyed=%s when planning reserve radars',
    (type, x, destroyed, expectedCount) => {
      const campaign = createCampaign()
      const theatre = createTheatre()
      campaign.coalitions.player.ewrGroups = [
        {
          id: 'existing-radar',
          type,
          destroyed,
          objectiveId: 'Test Base',
          position: { x, y: 5000 }
        }
      ]
      ensurePersistentGciEwrs(campaign, theatre)
      expect(campaign.coalitions.player.ewrGroups).toHaveLength(expectedCount)
      expect(campaign.coalitions.player.gciRadarSites).toEqual(['Test Base'])
    }
  )

  test('preserves an entirely destroyed reserve network through campaign schema loading', () => {
    const campaign = createCampaign()
    const theatre = createTheatre()
    ensurePersistentGciEwrs(campaign, theatre)
    for (const radar of campaign.coalitions.player.ewrGroups!) radar.destroyed = true
    const reloaded = schemas.campaign.campaign.parse(campaign)
    ensurePersistentGciEwrs(reloaded, theatre)
    const mission = createMission()
    addGciStations(mission, reloaded, theatre)
    expect(reloaded.coalitions.player.ewrGroups).toHaveLength(3)
    expect(
      mission.coalition.blue.country?.[0]?.vehicle?.group.map((group) => group.units[0]?.type)
    ).toEqual([GCI_STATION_TYPE])
  })

  test('assigns the nearest home station to each Fulcrum client and prints its WAVE channel', async () => {
    const campaign = createCampaign()
    const theatre = createTheatre()
    addField(theatre, 'Far Base', 400_000)
    campaign.coalitions.player.airdromeNames.push('Far Base')
    const second = structuredClone(campaign.coalitions.player.flightGroups[0]!)
    second.id = 'fulcrum-2'
    second.callsign = 'Uzi-1'
    second.homeBase = 'Far Base'
    second.position = { x: 400_000, y: 5000 }
    campaign.coalitions.player.flightGroups.push(second)
    const mission = createMission()
    const result = addFlightGroups(mission, campaign, theatre)
    if (result.isErr()) throw result.error
    const stations = addGciStations(mission, campaign, theatre)
    configureNativeGci(result.value, campaign, stations)
    expect(result.value.map((flight) => flight.nativeGci?.channel)).toEqual([1, 2])
    const svg = await renderKneeboardSvg({
      campaign,
      theatre,
      coalition: 'player',
      flightGroup: second,
      missionFlightConfigs: result.value
    })
    expect(svg).toContain('KRU GCI WAVE 2')
  })

  test.each([
    { ewr: true, iads: true },
    { ewr: true, iads: false },
    { ewr: false, iads: true },
    { ewr: false, iads: false }
  ])(
    'exports native KRU and persistent radars with EWR=$ewr and IADS=$iads',
    async ({ ewr, iads }) => {
      const directory = await mkdtemp(path.join(tmpdir(), 'dcc-kru-'))
      try {
        const campaign = createCampaign()
        campaign.coalitions.player.id = 'russia-1984'
        campaign.coalitions.player.countryName = 'Russia'
        campaign.coalitions.opponent.id = 'usa-1977'
        campaign.coalitions.opponent.countryName = 'USA'
        campaign.scenarioId = 'red-bullet'
        campaign.campaignParams = { ewr, iads }
        const theatre = createTheatre()
        const file = path.join(directory, 'mission.miz')
        const exported = await generateMizFromCampaign(campaign, theatre, file)
        if (exported.isErr()) throw exported.error
        const zip = new AdmZip(file)
        const missionText = zip.getEntry('mission')!.getData().toString('utf-8')
        expect(missionText).toContain('GCI_station_MiG29')
        expect(missionText).toContain('ActivateGCI')
        expect(missionText).toContain('nativeGci')
        expect(missionText).toContain('KRU GCI: select the WAVE channel')
        expect(zip.getEntry('l10n/DEFAULT/ewr.lua')!.getData().toString('utf-8')).toContain(
          'if not flightGroup.nativeGci then'
        )
        const dead = campaign.coalitions.player.ewrGroups![0]!
        dead.destroyed = true
        const regenerated = await generateMizFromCampaign(campaign, theatre, file)
        if (regenerated.isErr()) throw regenerated.error
        const nextMission = new AdmZip(file).getEntry('mission')!.getData().toString('utf-8')
        expect(nextMission).not.toContain(`IADS-EWR-Unit-${dead.id}`)
        expect(campaign.coalitions.player.ewrGroups).toHaveLength(3)
        expect(campaign.coalitions.player.gciRadarSites).toEqual(['Test Base'])
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    }
  )

  test.each([
    { gci: false, client: true },
    { gci: true, client: false }
  ])('exports no KRU guidance when gci=$gci and client=$client', async ({ gci, client }) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'dcc-kru-disabled-'))
    try {
      const campaign = createCampaign()
      campaign.coalitions.player.id = 'russia-1984'
      campaign.coalitions.player.countryName = 'Russia'
      campaign.coalitions.opponent.id = 'usa-1977'
      campaign.coalitions.opponent.countryName = 'USA'
      campaign.scenarioId = 'red-bullet'
      const theatre = createTheatre()
      addField(theatre, 'Enemy Base', 400_000)
      campaign.coalitions.opponent.airdromeNames = ['Enemy Base']
      // Exercise disabling an existing network, including its IADS-linked reserve radars.
      ensurePersistentGciEwrs(campaign, theatre)
      campaign.campaignParams = { gci, ewr: true, iads: true }
      campaign.coalitions.player.flightGroups[0]!.aircrafts[0]!.client = client
      const file = path.join(directory, 'mission.miz')
      const exported = await generateMizFromCampaign(campaign, theatre, file)
      if (exported.isErr()) throw exported.error
      const zip = new AdmZip(file)
      const missionText = zip.getEntry('mission')!.getData().toString('utf-8')
      expect(missionText).not.toContain('GCI_station_MiG29')
      expect(missionText).not.toContain('ActivateGCI')
      expect(missionText).not.toContain('nativeGci')
      expect(missionText).not.toContain('KRU GCI: select the WAVE channel')
      expect(missionText).not.toContain('IADS-EWR-Unit-gci-ewr-')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
