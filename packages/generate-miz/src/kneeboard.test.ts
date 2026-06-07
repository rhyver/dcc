import { schemas } from '@dcc/contracts'
import AdmZip from 'adm-zip'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'

import { generateMizFromCampaign } from './index'
import {
  buildKneeboardWaypointRows,
  createKneeboardFilename,
  getClientFlightGroups,
  sanitizeKneeboardFilenamePart
} from './kneeboard'
import {
  createRouteMapViewport,
  dcsPositionToLngLat,
  renderGeographicMapLayerFromPmtiles,
  resolveCaucasusPmtilesPath
} from './kneeboard-map'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type CampaignCoalition = Campaign['coalitions']['player']
type FlightGroup = z.infer<typeof schemas.flightGroup>
type Theatre = z.infer<typeof schemas.theatre>

const CAUCASUS_TEST_ROUTE = {
  takeoff: { x: -280_000, y: 620_000 },
  task: { x: -260_000, y: 640_000 },
  landing: { x: -240_000, y: 660_000 }
} as const

function createFlightGroup(id: string, callsign: string, startTime: Date): FlightGroup {
  return {
    id,
    aircrafts: [1, 2].map((unitNumber) => ({
      id: `${id}-${unitNumber}`,
      unitName: `${callsign}-${unitNumber}`,
      aircraftName: 'F-16C_50'
    })),
    task: 'CAP',
    position: CAUCASUS_TEST_ROUTE.takeoff,
    homeBase: 'Test Base',
    callsign,
    flightplan: {
      id: `${id}-plan`,
      startTime,
      waypoints: [
        {
          name: 'Take Off',
          position: CAUCASUS_TEST_ROUTE.takeoff,
          altitude: 0,
          speed: 150,
          type: 'TakeOff'
        },
        {
          name: 'CAP',
          position: CAUCASUS_TEST_ROUTE.task,
          altitude: 6000,
          speed: 185.2,
          type: 'Task'
        },
        {
          name: 'Landing',
          position: CAUCASUS_TEST_ROUTE.landing,
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
    updatedAt: startTime,
    time: startTime,
    timeMultiplier: 1,
    logs: [],
    scenarioId: 'scenario',
    coalitions: {
      player: {
        ...emptyCoalition,
        id: 'player',
        flightGroups: []
      },
      opponent: {
        ...emptyCoalition,
        id: 'opponent',
        flightGroups: []
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
    center: { x: -260_000, y: 640_000 },
    weather: {
      temperature: { amplitude: 0, mean: 20 },
      cloudCover: { baseCloudCover: 0, seasonEffect: 0 },
      wind: { speed: 0, direction: 0 }
    },
    night: { startHour: 20, endHour: 6 }
  }
}

describe('kneeboard client flight selection', () => {
  test('selects only flight groups with client aircraft and creates stable safe filenames', () => {
    const startTime = new Date('2026-01-01T12:00:00Z')
    const campaign = createCampaign(startTime)
    const clientGroup = createFlightGroup('blue-client', 'Enfield/1', startTime)
    clientGroup.aircrafts[0]!.client = true
    const aiGroup = createFlightGroup('blue-ai', 'Chevy-2', startTime)
    campaign.coalitions.player.flightGroups = [clientGroup, aiGroup]

    const clientGroups = getClientFlightGroups(campaign)

    expect(clientGroups.map(({ flightGroup }) => flightGroup.callsign)).toEqual(['Enfield/1'])
    expect(sanitizeKneeboardFilenamePart(' Pinpoint Strike! ')).toBe('Pinpoint-Strike')
    expect(createKneeboardFilename(1, clientGroup)).toBe('DCC_001_Enfield-1_CAP.png')
  })
})

describe('kneeboard geographic map', () => {
  test('renders protomaps water and land paths when caucasus tiles are available', async () => {
    if (!resolveCaucasusPmtilesPath()) return

    const lngLatPoints = [
      dcsPositionToLngLat(
        CAUCASUS_TEST_ROUTE.takeoff.x,
        CAUCASUS_TEST_ROUTE.takeoff.y,
        'Caucasus'
      ),
      dcsPositionToLngLat(CAUCASUS_TEST_ROUTE.task.x, CAUCASUS_TEST_ROUTE.task.y, 'Caucasus'),
      dcsPositionToLngLat(
        CAUCASUS_TEST_ROUTE.landing.x,
        CAUCASUS_TEST_ROUTE.landing.y,
        'Caucasus'
      )
    ].filter((point): point is NonNullable<typeof point> => point != null)

    const viewport = createRouteMapViewport({
      lngLatPoints,
      box: { x: 0, y: 0, width: 640, height: 228, padding: 26 }
    })
    expect(viewport).toBeDefined()
    if (!viewport) return

    const layer = await renderGeographicMapLayerFromPmtiles({
      bounds: viewport.bounds,
      projectLngLat: viewport.projectLngLat
    })

    expect(layer).toContain('map-land')
    expect(layer).toContain('map-sea')
  })
})

describe('kneeboard waypoint rows', () => {
  test('formats route timing, distance, bearing, altitude, and speed', () => {
    const startTime = new Date('2026-01-01T12:00:00Z')
    const rows = buildKneeboardWaypointRows(createFlightGroup('blue-client', 'Enfield-1', startTime))

    expect(rows).toMatchObject([
      {
        index: 1,
        eta: '12:00Z',
        altitude: '0',
        speed: '292',
        legDistance: '---',
        totalDistance: '---',
        bearing: '---',
        remarks: 'DEPART'
      },
      {
        index: 2,
        eta: '12:02Z',
        altitude: '19,685',
        speed: '360',
        legDistance: '15.3',
        totalDistance: '15.3',
        bearing: '045',
        remarks: 'CAP'
      },
      {
        index: 3,
        eta: '12:05Z',
        altitude: '0',
        speed: '292',
        legDistance: '15.3',
        totalDistance: '30.5',
        bearing: '045',
        remarks: 'LAND'
      }
    ])
  })
})

describe('generateMizFromCampaign kneeboards', () => {
  test('adds kneeboard PNGs for client groups only', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'dcc-kneeboard-'))
    const mizPath = path.join(dir, 'mission.miz')

    try {
      const startTime = new Date('2026-01-01T12:00:00Z')
      const campaign = createCampaign(startTime)
      const clientGroup = createFlightGroup('blue-client', 'Enfield-1', startTime)
      clientGroup.aircrafts[0]!.client = true
      campaign.coalitions.player.flightGroups = [
        clientGroup,
        createFlightGroup('blue-ai', 'Chevy-2', startTime)
      ]

      const result = await generateMizFromCampaign(campaign, theatre, mizPath)

      expect(result.isOk()).toBe(true)
      if (result.isErr()) throw result.error

      const zip = new AdmZip(mizPath)
      const entries = zip.getEntries().map((entry) => entry.entryName)
      const kneeboardEntries = entries.filter((entry) => entry.startsWith('KNEEBOARD/IMAGES/'))

      expect(kneeboardEntries).toEqual(['KNEEBOARD/IMAGES/DCC_001_Enfield-1_CAP.png'])
      const kneeboardEntry = zip.getEntry('KNEEBOARD/IMAGES/DCC_001_Enfield-1_CAP.png')
      expect(kneeboardEntry?.getData().subarray(0, 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      )
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  test('does not add kneeboard entries when there are no client flight groups', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'dcc-kneeboard-'))
    const mizPath = path.join(dir, 'mission.miz')

    try {
      const startTime = new Date('2026-01-01T12:00:00Z')
      const campaign = createCampaign(startTime)
      campaign.coalitions.player.flightGroups = [createFlightGroup('blue-ai', 'Chevy-2', startTime)]

      const result = await generateMizFromCampaign(campaign, theatre, mizPath)

      expect(result.isOk()).toBe(true)
      if (result.isErr()) throw result.error

      const zip = new AdmZip(mizPath)
      const kneeboardEntries = zip
        .getEntries()
        .map((entry) => entry.entryName)
        .filter((entry) => entry.startsWith('KNEEBOARD/IMAGES/'))

      expect(kneeboardEntries).toEqual([])
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
