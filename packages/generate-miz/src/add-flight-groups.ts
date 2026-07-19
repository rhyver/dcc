import { config, schemas } from '@dcc/contracts'
import { aircrafts, callsigns } from '@dcc/data'
import { err, ok, Result } from 'neverthrow'
import * as z from 'zod'

// Build lookup map once
const aircraftMap = new Map<string, z.infer<typeof schemas.dcs.aircraft>>()
Object.values(aircrafts).forEach((def) => {
  if (def && typeof def === 'object' && 'name' in def) {
    aircraftMap.set(def.name, def)
  }
})

const STARTUP_DELAY_MS = 10 * 60 * 1000 // 10 minutes in milliseconds
const FEET_TO_METERS = 0.3048
const MIN_AIRCRAFT_AIRBORNE_SPAWN_ALTITUDE = 10_000 * FEET_TO_METERS
const MIN_HELICOPTER_AIRBORNE_SPAWN_ALTITUDE = 200 * FEET_TO_METERS
const JTAC_ALTITUDE = 3048
const JTAC_SPEED = 80
const JTAC_FREQUENCY = 133
const DEFAULT_FLIGHT_GROUP_FREQUENCY: FrequencyRange = [251, 399]
const FREQUENCY_STEP = 0.05
const FREQUENCY_PRECISION = 2
const JTAC_LASER_CODE = 1688
const TARGET_TACAN_OFFSET_METERS = 500
const TARGET_TACAN_START_CHANNEL = 31

type Mission = z.infer<typeof schemas.dcs.mission>
type MissionCountry = NonNullable<Mission['coalition']['blue']['country']>[number]
type Campaign = z.infer<typeof schemas.campaign.campaign>
type CoalitionKey = z.infer<typeof schemas.coalition>
type FlightGroup = Campaign['coalitions']['player']['flightGroups'][number]
type FrequencyRange = [number, number]
type NavigationAid = NonNullable<NonNullable<Campaign['campaignParams']>['navigationAid']>
type NavigationFeatureFlags = {
  vectors: boolean
  targetTacan: boolean
}

const DEFAULT_CALLSIGN = 'Enfield'

function parseGroupCallsign(groupCallsign: string) {
  const match = groupCallsign.match(/^([A-Za-z]+)-(\d+)$/)
  const callsignName = match?.[1] ?? DEFAULT_CALLSIGN
  const flightNumber = Number.parseInt(match?.[2] ?? '1', 10)
  const callsignIndex = callsigns.indexOf(callsignName) + 1
  const dcsCallsignIndex =
    callsignIndex > 0 ? callsignIndex : callsigns.indexOf(DEFAULT_CALLSIGN) + 1
  const dcsFlightNumber = Number.isFinite(flightNumber) ? Math.max(1, Math.min(9, flightNumber)) : 1

  return {
    callsignIndex: dcsCallsignIndex,
    callsignName: callsigns[dcsCallsignIndex - 1] ?? DEFAULT_CALLSIGN,
    flightNumber: dcsFlightNumber
  }
}

function createDcsCallsign(groupCallsign: string, unitIndex: number) {
  const parsed = parseGroupCallsign(groupCallsign)
  const unitNumber = Math.max(1, Math.min(9, unitIndex + 1))

  return {
    '1': parsed.callsignIndex,
    '2': parsed.flightNumber,
    name: `${parsed.callsignName}${parsed.flightNumber}${unitNumber}`,
    '3': unitNumber
  }
}

function createVoiceCallsignLabel(groupCallsign: string) {
  const parsed = parseGroupCallsign(groupCallsign)
  return parsed.callsignName
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 2)
    .toUpperCase()
}

function createAircraftUnitName(groupCallsign: string, unitIndex: number) {
  return `${groupCallsign}-${unitIndex + 1}`
}

function formatTargetLabel(flightGroup: FlightGroup) {
  if (!flightGroup.target) return 'Target'
  return flightGroup.target.type
    ? `${flightGroup.target.type} ${flightGroup.target.objectiveId}`
    : flightGroup.target.objectiveId
}

function resolveTargetPosition(
  campaign: Campaign,
  theatre: z.infer<typeof schemas.theatre>,
  flightGroup: FlightGroup
) {
  if (!flightGroup.target) return undefined

  for (const coalition of Object.values(campaign.coalitions)) {
    const downedPilot = coalition.downedPilots?.find((pilot) => pilot.id === flightGroup.target?.id)
    if (downedPilot) return downedPilot.position

    const groundGroup = coalition.groundGroups.find((group) => group.id === flightGroup.target?.id)
    if (groundGroup) return groundGroup.position

    const structure = coalition.structures.find(
      (candidate) => candidate.id === flightGroup.target?.id
    )
    if (structure) return structure.position
  }

  const theatreTarget = theatre.targets[flightGroup.target.objectiveId]?.find(
    (target) => target.name === flightGroup.target?.id
  )
  if (theatreTarget) return theatreTarget.position

  return theatre.objectives.find((objective) => objective.name === flightGroup.target?.objectiveId)
    ?.position
}

function resolveNavigationFeatureFlags(campaign: Campaign): NavigationFeatureFlags {
  const params = campaign.campaignParams
  const legacyNavigationAid = params?.navigationAid ?? 'targetVector'
  const legacyVectorsEnabled =
    legacyNavigationAid === 'targetVector' || legacyNavigationAid === 'landingAirport'

  return {
    vectors:
      params?.navigationVectors ??
      params?.navigationTargetVectors ??
      params?.navigationLandingVectors ??
      legacyVectorsEnabled,
    targetTacan: params?.navigationTargetTacan ?? legacyNavigationAid === 'targetTacan'
  }
}

function createTargetTacanGroup(params: {
  groupId: number
  unitId: number
  name: string
  position: z.infer<typeof schemas.position>
  channel: number
  callsign: string
}) {
  const x = params.position.x + TARGET_TACAN_OFFSET_METERS
  const y = params.position.y + TARGET_TACAN_OFFSET_METERS
  const frequency = (params.channel + 961) * 1_000_000

  return {
    groupId: params.groupId,
    name: params.name,
    task: 'Ground Nothing',
    hidden: true,
    visible: false,
    x,
    y,
    units: [
      {
        unitId: params.unitId,
        name: `${params.name}-1`,
        type: 'TACAN_beacon',
        skill: 'Excellent',
        playerCanDrive: false,
        coldAtStart: false,
        heading: 0,
        x,
        y
      }
    ],
    route: {
      points: [
        {
          alt: 0,
          alt_type: 'BARO',
          action: 'Off Road',
          type: 'Turning Point',
          ETA: 0,
          ETA_locked: true,
          speed: 0,
          speed_locked: true,
          x,
          y,
          task: {
            id: 'ComboTask',
            params: {
              tasks: [
                createWrappedActionTask({ id: 'SetImmortal', params: { value: true } }, 1),
                createWrappedActionTask({ id: 'SetInvisible', params: { value: true } }, 2),
                createWrappedActionTask(
                  {
                    id: 'ActivateBeacon',
                    params: {
                      type: 4,
                      AA: false,
                      unitId: params.unitId,
                      system: 18,
                      name: params.callsign,
                      channel: params.channel,
                      callsign: params.callsign,
                      modeChannel: 'X',
                      bearing: true,
                      frequency
                    }
                  },
                  3
                )
              ]
            }
          }
        }
      ]
    }
  }
}

export type CasFlightConfig = {
  groupId: number
  name: string
  task: 'CAS'
  unitNames: string[]
  isHelicopter?: boolean
  navigation?: MissionNavigationConfig
  jtacName: string
  targetGroupName: string
  laserCode: number
}

export type CsarMissionConfig = {
  pilotId: string
  pilotName: string
  position: { x: number; y: number }
  pickupRadius: number
}

export type MissionFlightConfig =
  | CasFlightConfig
  | {
      groupId: number
      name: string
      task: z.infer<typeof schemas.task>
      unitNames: string[]
      isHelicopter?: boolean
      navigation?: MissionNavigationConfig
      csar?: CsarMissionConfig
    }

export type MissionNavigationConfig = {
  mode?: NavigationAid
  targetLabel?: string
  targetPoint?: {
    x: number
    z: number
  }
  landingLabel?: string
  landingPoint?: {
    x: number
    z: number
  }
  landingTacan?: {
    channel: number | string
    band?: string
    callsign?: string
  }
  tacan?: {
    channel: number
    band: 'X'
    callsign: string
  }
}

function hasPlayerClientCap(campaign: Campaign) {
  return campaign.coalitions.player.flightGroups.some(
    (flightGroup) =>
      flightGroup.task === 'CAP' && flightGroup.aircrafts.some((aircraft) => aircraft.client)
  )
}

function shouldIncludeFlightGroupInMission(
  coalition: CoalitionKey,
  flightGroup: FlightGroup,
  options: { throttleEnemyNonCapFlights: boolean }
) {
  if (!options.throttleEnemyNonCapFlights) return true
  if (coalition !== 'opponent') return true
  if (flightGroup.task === 'CAP') return true
  if (flightGroup.task === 'Strategic Strike') return true
  if (flightGroup.aircrafts.some((aircraft) => aircraft.client)) return true

  return Math.random() < 1 / 3
}

function roundFrequency(frequency: number) {
  return Number(frequency.toFixed(FREQUENCY_PRECISION))
}

function createFlightGroupFrequencyAllocator() {
  const assignedFrequencies = new Set<number>([JTAC_FREQUENCY])
  const nextFrequencyByRange = new Map<string, number>()

  return (aircraftDef: z.infer<typeof schemas.dcs.aircraft>) => {
    const [minFrequency, maxFrequency] =
      aircraftDef.allowedFrequency ?? DEFAULT_FLIGHT_GROUP_FREQUENCY
    const rangeKey = `${minFrequency}-${maxFrequency}`
    let frequency = nextFrequencyByRange.get(rangeKey) ?? minFrequency

    while (frequency <= maxFrequency) {
      const roundedFrequency = roundFrequency(frequency)

      if (!assignedFrequencies.has(roundedFrequency)) {
        assignedFrequencies.add(roundedFrequency)
        nextFrequencyByRange.set(rangeKey, roundFrequency(roundedFrequency + FREQUENCY_STEP))
        return roundedFrequency
      }

      frequency = roundFrequency(frequency + FREQUENCY_STEP)
    }

    throw new Error(
      `no available radio frequency for ${aircraftDef.name} in range ${minFrequency}-${maxFrequency} MHz`
    )
  }
}

/**
 * Creates a SEADEscort task for SEAD flight groups.
 * This is an "Escort" task that makes the SEAD aircraft follow the strike group
 * while targeting Medium Range and Long Range SAMs.
 */
function createSEADEscortTask(
  targetGroupId: number,
  taskNumber: number
): z.infer<typeof schemas.dcs.task> {
  return {
    enabled: true,
    auto: false,
    id: 'Escort',
    number: taskNumber,
    params: {
      groupId: targetGroupId,
      noTargetTypes: ['AAA', 'SR SAM'],
      engagementDistMax: 74000,
      targetTypes: ['MR SAM', 'LR SAM'],
      value: 'MR SAM;LR SAM;',
      lastWptIndexFlag: false,
      lastWptIndexFlagChangedManually: true,
      lastWptIndex: 0,
      pos: {
        y: 0,
        x: -1000,
        z: 200
      }
    }
  }
}

function createCapOrbitTask(
  racetrackStart: z.infer<typeof schemas.position>,
  racetrackEnd: z.infer<typeof schemas.position>,
  speed: number,
  altitude: number,
  durationMs: number,
  taskNumber: number
): z.infer<typeof schemas.dcs.task> {
  return {
    enabled: true,
    auto: false,
    id: 'Orbit',
    number: taskNumber,
    params: {
      pattern: 'Race-Track',
      point: {
        x: racetrackStart.x,
        y: racetrackStart.y
      },
      point2: {
        x: racetrackEnd.x,
        y: racetrackEnd.y
      },
      speed: speed,
      altitude: altitude,
      duration: Math.max(1, Math.round(durationMs / 1000))
    }
  }
}

function createWrappedActionTask(
  action: { id: string; params?: Record<string, unknown> },
  taskNumber: number
): z.infer<typeof schemas.dcs.task> {
  return {
    enabled: true,
    auto: true,
    id: 'WrappedAction',
    number: taskNumber,
    params: {
      action
    }
  }
}

function findMissionGroundGroupName(
  mission: z.infer<typeof schemas.dcs.mission>,
  coalitionKey: 'blue' | 'red' | 'neutrals',
  groundGroupId: string
): string | null {
  const countries = mission.coalition[coalitionKey].country ?? []
  const namePrefix = `Ground-${groundGroupId}-`

  for (const country of countries) {
    const vehicleGroups = country.vehicle?.group ?? []
    for (const group of vehicleGroups) {
      if (group.name.startsWith(namePrefix)) {
        return group.name
      }
    }
  }

  return null
}

function addJtacPredator(params: {
  country: MissionCountry
  nextId: () => number
  targetId: string
  targetPosition: z.infer<typeof schemas.position>
  groupId: number
}): string {
  const jtacGroupId = params.nextId()
  const jtacUnitId = params.nextId()
  const groupName = `FAC-${params.targetId}`
  const unitName = `${groupName}-1`

  params.country.plane ??= { group: [] }
  params.country.plane.group.push({
    groupId: jtacGroupId,
    name: groupName,
    start_time: 0,
    task: 'AFAC',
    tasks: [],
    uncontrolled: false,
    taskSelected: true,
    hiddenOnMFD: false,
    hiddenOnPlanner: false,
    lateActivation: false,
    radioSet: false,
    units: [
      {
        alt: JTAC_ALTITUDE,
        alt_type: 'BARO',
        livery_id: 'default',
        skill: 'High',
        speed: JTAC_SPEED,
        heading: 0,
        type: 'RQ-1A Predator',
        unitId: jtacUnitId,
        psi: 0,
        x: params.targetPosition.x,
        y: params.targetPosition.y,
        name: unitName,
        payload: {
          pylons: {},
          fuel: 200,
          flare: 0,
          chaff: 0,
          gun: 100
        },
        callsign: {
          _1: 1,
          _2: jtacGroupId,
          _3: 1,
          name: `Enfield${jtacGroupId}1`
        },
        onboard_num: '010'
      }
    ],
    x: params.targetPosition.x,
    y: params.targetPosition.y,
    route: {
      points: [
        {
          alt: JTAC_ALTITUDE,
          action: 'Turning Point',
          name: '',
          alt_type: 'BARO',
          speed: JTAC_SPEED,
          task: {
            id: 'ComboTask',
            params: {
              tasks: [
                createWrappedActionTask({ id: 'SetImmortal', params: { value: true } }, 1),
                createWrappedActionTask({ id: 'SetInvisible', params: { value: true } }, 2),
                {
                  enabled: true,
                  auto: true,
                  id: 'FAC',
                  number: 3,
                  params: {}
                },
                createWrappedActionTask(
                  {
                    id: 'EPLRS',
                    params: { value: true, groupId: params.groupId }
                  },
                  4
                ),
                {
                  enabled: true,
                  auto: false,
                  id: 'Orbit',
                  number: 5,
                  params: {
                    altitude: JTAC_ALTITUDE,
                    pattern: 'Circle',
                    speed: JTAC_SPEED,
                    altitudeEdited: true
                  }
                }
              ]
            }
          },
          type: 'Turning Point',
          ETA: 0,
          ETA_locked: true,
          x: params.targetPosition.x,
          y: params.targetPosition.y,
          speed_locked: true,
          formation_template: ''
        }
      ]
    },
    modulation: 0,
    hidden: false,
    communication: true,
    frequency: JTAC_FREQUENCY
  })

  return unitName
}

function cloneAircraftUnitOption<T>(value: T): T {
  return structuredClone(value)
}

function createAddPropAircraft(
  aircraftDef: z.infer<typeof schemas.dcs.aircraft>,
  groupCallsign: string,
  index: number,
  link16StationNumber?: string
) {
  if (!aircraftDef.AddPropAircraft) return undefined

  const addPropAircraft = cloneAircraftUnitOption(aircraftDef.AddPropAircraft)
  const callsign = createDcsCallsign(groupCallsign, index)

  Object.entries(addPropAircraft).forEach(([key, value]) => {
    if (value === '{STN_L16}') {
      addPropAircraft[key] = link16StationNumber ?? `002${(index + 1).toString().padStart(2, '0')}`
    }
    if (value === '{VoiceCallsignNumber}') {
      addPropAircraft[key] = `${callsign['2']}${callsign['3']}`
    }
    if (key === 'VoiceCallsignLabel') {
      addPropAircraft[key] = createVoiceCallsignLabel(groupCallsign)
    }
  })

  return addPropAircraft
}

function createDatalinks(
  aircraftDef: z.infer<typeof schemas.dcs.aircraft>,
  index: number,
  flightUnitIds: number[],
  coalitionLink16UnitIds: number[]
) {
  if (!aircraftDef.datalinks) return undefined

  const datalinks = cloneAircraftUnitOption(aircraftDef.datalinks)
  const networkUnitIds = [...new Set([...flightUnitIds, ...coalitionLink16UnitIds])]
  const teamMemberUnitIds = networkUnitIds.slice(0, 8)
  const donorUnitIds = networkUnitIds.slice(8, 12)

  datalinks.Link16.settings.flightLead = index === 0
  datalinks.Link16.network = {
    teamMembers: teamMemberUnitIds.map((unitId) => ({
      TDOA: true,
      missionUnitId: unitId
    })),
    donors: donorUnitIds.map((unitId) => ({ missionUnitId: unitId }))
  }

  return datalinks
}

function ensureFirstWaypointEplrs(
  routePoints: z.infer<typeof schemas.dcs.aircraftRoutePoint>[],
  groupId: number
) {
  const firstWaypoint = routePoints[0]
  if (!firstWaypoint) return

  type ComboTask = {
    id: 'ComboTask'
    params: { tasks: unknown[] }
  }

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

  const isComboTask = (value: unknown): value is ComboTask => {
    if (!isRecord(value)) return false
    if (value.id !== 'ComboTask') return false
    if (!isRecord(value.params)) return false
    return Array.isArray(value.params.tasks)
  }

  const isEplrsWrappedActionTask = (value: unknown): boolean => {
    if (!isRecord(value)) return false
    if (value.id !== 'WrappedAction') return false
    if (!isRecord(value.params)) return false
    if (!isRecord(value.params.action)) return false
    if (value.params.action.id !== 'EPLRS') return false
    if (!isRecord(value.params.action.params)) return false
    return value.params.action.params.value === true
  }

  if (!isComboTask(firstWaypoint.task)) {
    firstWaypoint.task = {
      id: 'ComboTask',
      params: { tasks: [] }
    }
  }

  const tasks = (firstWaypoint.task as ComboTask).params.tasks
  const hasEplrs = tasks.some(isEplrsWrappedActionTask)

  if (hasEplrs) return

  tasks.push(
    createWrappedActionTask(
      {
        id: 'EPLRS',
        params: { value: true, groupId }
      },
      tasks.length + 1
    )
  )
}

/**
 * Calculate current position along the flight path based on elapsed time.
 * Returns null if the flight hasn't taken off yet.
 * Also returns the index of the next waypoint the aircraft is heading toward.
 */
function calculateInFlightPosition(
  flightplan: z.infer<typeof schemas.flightplan>,
  campaignTime: Date,
  patrolDurationMs?: number
): {
  position: z.infer<typeof schemas.position>
  altitude: number
  heading: number
  nextWaypointIndex: number
  capOrbit?: {
    remainingMs: number
    racetrackStart: z.infer<typeof schemas.position>
    racetrackEnd: z.infer<typeof schemas.position>
    speed: number
    altitude: number
  }
} | null {
  const startTime = new Date(flightplan.startTime)
  if (campaignTime < startTime) {
    return null
  }

  let elapsed = campaignTime.getTime() - startTime.getTime()

  if (elapsed < STARTUP_DELAY_MS) {
    return null // Still on ground during startup
  }

  elapsed -= STARTUP_DELAY_MS

  const waypoints = flightplan.waypoints

  const getLegTimeMs = (
    from: z.infer<typeof schemas.position>,
    to: z.infer<typeof schemas.position>,
    speed: number
  ) => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    return speed > 0 ? (dist / speed) * 1000 : 0
  }

  const getPositionAlong = (
    from: z.infer<typeof schemas.position>,
    to: z.infer<typeof schemas.position>,
    ratio: number
  ) => ({
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio
  })

  const getHeading = (
    from: z.infer<typeof schemas.position>,
    to: z.infer<typeof schemas.position>
  ) => Math.atan2(to.x - from.x, to.y - from.y)

  const racetrackStartIndex =
    patrolDurationMs && patrolDurationMs > 0
      ? waypoints.findIndex(
          (wp, idx) => wp.type === 'Task' && waypoints[idx + 1]?.type === 'RaceTrack End'
        )
      : -1

  if (racetrackStartIndex !== -1) {
    const racetrackEndIndex = racetrackStartIndex + 1
    const racetrackStart = waypoints[racetrackStartIndex]
    const racetrackEnd = waypoints[racetrackEndIndex]

    if (racetrackStart && racetrackEnd) {
      let timeToRacetrackStartMs = 0
      for (let i = 0; i < racetrackStartIndex; i++) {
        const startWp = waypoints[i]
        const endWp = waypoints[i + 1]
        if (!startWp || !endWp) continue
        timeToRacetrackStartMs += getLegTimeMs(startWp.position, endWp.position, endWp.speed)
      }

      if (elapsed >= timeToRacetrackStartMs) {
        const legTimeMs = getLegTimeMs(
          racetrackStart.position,
          racetrackEnd.position,
          racetrackEnd.speed
        )
        const patrolMs = patrolDurationMs ?? 0

        if (elapsed < timeToRacetrackStartMs + patrolMs) {
          const timeInPatrol = elapsed - timeToRacetrackStartMs
          const cycleTime = legTimeMs * 2
          const cyclePos = cycleTime > 0 ? timeInPatrol % cycleTime : 0

          const forwardLeg = cyclePos <= legTimeMs
          const legElapsed = forwardLeg ? cyclePos : cyclePos - legTimeMs
          const ratio = legTimeMs > 0 ? legElapsed / legTimeMs : 0
          const from = forwardLeg ? racetrackStart : racetrackEnd
          const to = forwardLeg ? racetrackEnd : racetrackStart

          const position = getPositionAlong(from.position, to.position, ratio)
          const altitude = from.altitude + (to.altitude - from.altitude) * ratio
          const heading = getHeading(from.position, to.position)
          const remainingMs = Math.max(0, patrolMs - timeInPatrol)

          return {
            position,
            altitude,
            heading,
            nextWaypointIndex: racetrackEndIndex,
            capOrbit: {
              remainingMs,
              racetrackStart: racetrackStart.position,
              racetrackEnd: racetrackEnd.position,
              speed: racetrackEnd.speed,
              altitude: racetrackStart.altitude
            }
          }
        }

        let remainingMs = elapsed - timeToRacetrackStartMs - patrolMs
        const patrolEndCycleTime = legTimeMs * 2
        const patrolEndCyclePos = patrolEndCycleTime > 0 ? patrolMs % patrolEndCycleTime : 0
        const patrolForwardLeg = patrolEndCyclePos <= legTimeMs
        const patrolLegElapsed = patrolForwardLeg
          ? patrolEndCyclePos
          : patrolEndCyclePos - legTimeMs
        const patrolRatio = legTimeMs > 0 ? patrolLegElapsed / legTimeMs : 0
        const patrolFrom = patrolForwardLeg ? racetrackStart : racetrackEnd
        const patrolTo = patrolForwardLeg ? racetrackEnd : racetrackStart
        let currentPos = getPositionAlong(patrolFrom.position, patrolTo.position, patrolRatio)
        let currentAlt =
          patrolFrom.altitude + (patrolTo.altitude - patrolFrom.altitude) * patrolRatio

        for (let i = racetrackEndIndex; i < waypoints.length - 1; i++) {
          const endWp = waypoints[i + 1]
          if (!endWp) continue

          const timeMs = getLegTimeMs(currentPos, endWp.position, endWp.speed)
          if (remainingMs < timeMs) {
            const ratio = timeMs > 0 ? remainingMs / timeMs : 0
            const position = getPositionAlong(currentPos, endWp.position, ratio)
            const altitude = currentAlt + (endWp.altitude - currentAlt) * ratio
            const heading = getHeading(currentPos, endWp.position)
            return {
              position,
              altitude,
              heading,
              nextWaypointIndex: i + 1
            }
          }

          remainingMs -= timeMs
          currentPos = endWp.position
          currentAlt = endWp.altitude
        }

        return {
          position: currentPos,
          altitude: currentAlt,
          heading: 0,
          nextWaypointIndex: waypoints.length - 1
        }
      }
    }
  }

  for (let i = 0; i < waypoints.length - 1; i++) {
    const startWp = waypoints[i]
    const endWp = waypoints[i + 1]

    if (!startWp || !endWp) {
      continue
    }

    const dx = endWp.position.x - startWp.position.x
    const dy = endWp.position.y - startWp.position.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const speed = endWp.speed

    const timeSeconds = speed > 0 ? dist / speed : 0
    const timeMs = timeSeconds * 1000

    if (elapsed < timeMs) {
      const ratio = elapsed / timeMs
      const currentAlt = startWp.altitude + (endWp.altitude - startWp.altitude) * ratio
      // Calculate heading: atan2(dy, dx) gives angle from east, we need angle from north
      const heading = Math.atan2(dx, dy) // Heading in radians (north = 0)
      return {
        position: {
          x: startWp.position.x + dx * ratio,
          y: startWp.position.y + dy * ratio
        },
        altitude: currentAlt,
        heading: heading,
        nextWaypointIndex: i + 1
      }
    }

    elapsed -= timeMs
  }

  // Past all waypoints - return final position
  if (waypoints.length > 0) {
    const lastWp = waypoints[waypoints.length - 1]
    if (lastWp) {
      return {
        position: lastWp.position,
        altitude: lastWp.altitude,
        heading: 0,
        nextWaypointIndex: waypoints.length - 1
      }
    }
  }

  return null
}

function getAirborneSpawnAltitude(altitude: number, isHelicopter?: boolean) {
  const minimumAltitude = isHelicopter
    ? MIN_HELICOPTER_AIRBORNE_SPAWN_ALTITUDE
    : MIN_AIRCRAFT_AIRBORNE_SPAWN_ALTITUDE
  return Math.max(altitude, minimumAltitude)
}

export function addFlightGroups(
  mission: z.infer<typeof schemas.dcs.mission>,
  campaign: z.infer<typeof schemas.campaign.campaign>,
  theatre: z.infer<typeof schemas.theatre>
): Result<MissionFlightConfig[], Error> {
  const nextId = () => {
    mission.currentKey += 1
    return mission.currentKey
  }

  const structureMap = new Map<
    string,
    (typeof campaign)['coalitions']['player']['structures'][number]
  >()

  Object.values(campaign.coalitions).forEach((coalition) => {
    coalition.structures.forEach((structure) => {
      structureMap.set(structure.id, structure)
    })
  })

  // First pass: Pre-assign DCS group/unit IDs to all flight groups.
  // Group IDs are needed so SEAD flights can reference their escort target's groupId.
  // Unit IDs are needed before rendering units so Link-16 networks can include other friendly flights.
  const flightGroupIdToGroupId = new Map<string, number>()
  const flightGroupIdToUnitIds = new Map<string, number[]>()
  const coalitionLink16UnitIds = new Map<string, number[]>()
  const link16StationNumberByUnitId = new Map<number, string>()
  const navigationFeatures = resolveNavigationFeatureFlags(campaign)
  let nextTacanChannel = TARGET_TACAN_START_CHANNEL
  let nextTacanCallsign = 1

  for (const [key, value] of Object.entries(campaign.coalitions)) {
    const flightGroups = value.flightGroups
    if (!flightGroups) continue

    let link16FlightNumber = 2

    for (const fg of flightGroups) {
      const groupId = nextId()
      flightGroupIdToGroupId.set(fg.id, groupId)

      const unitIds = fg.aircrafts.map(() => nextId())
      flightGroupIdToUnitIds.set(fg.id, unitIds)

      const link16Units = fg.aircrafts
        .map((aircraft, index) => ({
          aircraftDef: aircraftMap.get(aircraft.aircraftName),
          index,
          unitId: unitIds[index]
        }))
        .filter(
          (
            unit
          ): unit is {
            aircraftDef: z.infer<typeof schemas.dcs.aircraft>
            index: number
            unitId: number
          } => unit.aircraftDef?.datalinks != null && unit.unitId != null
        )

      if (link16Units.length === 0) continue

      const link16FlightPrefix = link16FlightNumber.toString().padStart(3, '0')
      link16FlightNumber += 1
      const link16UnitIds = coalitionLink16UnitIds.get(key) ?? []

      link16Units.forEach(({ index, unitId }) => {
        link16UnitIds.push(unitId)
        link16StationNumberByUnitId.set(
          unitId,
          `${link16FlightPrefix}${(index + 1).toString().padStart(2, '0')}`
        )
      })
      coalitionLink16UnitIds.set(key, link16UnitIds)
    }
  }

  // Build a lookup for packages to find the primary (strike) flight group for SEAD escort
  const packagePrimaryFlightGroupId = new Map<string, string>()
  for (const [, value] of Object.entries(campaign.coalitions)) {
    const packages = value.packages
    if (!packages) continue

    for (const pkg of packages) {
      const primaryMember = pkg.members.find((m) => m.role === 'primary')
      if (primaryMember) {
        packagePrimaryFlightGroupId.set(pkg.id, primaryMember.flightGroupId)
      }
    }
  }

  const usedParkingSlots = new Map<string, Set<string>>() // Airdrome Name -> Set of Slot IDs
  const flightConfigs: MissionFlightConfig[] = []
  const assignFlightGroupFrequency = createFlightGroupFrequencyAllocator()
  const hotStart = campaign.campaignParams?.hotStart === true
  const casJtac = campaign.campaignParams?.casJtac ?? true
  const throttleEnemyNonCapFlights = !hasPlayerClientCap(campaign)

  for (const [key, value] of Object.entries(campaign.coalitions)) {
    const missionCoalitionKey = key === 'player' ? 'blue' : key === 'opponent' ? 'red' : 'neutrals'
    const coalitionKey = key as CoalitionKey
    const flightGroups = value.flightGroups?.filter((fg) =>
      shouldIncludeFlightGroupInMission(coalitionKey, fg, { throttleEnemyNonCapFlights })
    )

    if (!flightGroups || flightGroups.length === 0) continue

    // eslint-disable-next-line no-console
    console.log(
      `Adding ${flightGroups.length} flight groups for coalition ${missionCoalitionKey} (${key})`
    )

    const countryList = mission.coalition[missionCoalitionKey].country

    // countryList is guaranteed to be non-empty array here
    const country = countryList?.[0]
    if (country == null) {
      return err(new Error(`no country found for coalition ${missionCoalitionKey} ${key}`))
    }

    if (!country.plane) {
      country.plane = { group: [] }
    }
    if (!country.helicopter) {
      country.helicopter = { group: [] }
    }
    if (!country.vehicle) {
      country.vehicle = { group: [] }
    }
    const vehicleGroups = country.vehicle.group

    flightGroups.forEach((fg) => {
      const firstAircraft = fg.aircrafts[0]
      if (!firstAircraft) return

      const aircraftDef = aircraftMap.get(firstAircraft.aircraftName)

      if (!aircraftDef) {
        // eslint-disable-next-line no-console
        console.warn(`Aircraft definition not found for ${firstAircraft.aircraftName}`)
        return
      }

      // Use the pre-assigned group ID
      const groupId = flightGroupIdToGroupId.get(fg.id) ?? nextId()
      const groupName = fg.callsign // Or some unique name?

      const isHelicopter = aircraftDef.isHelicopter ?? false
      const taskName = fg.task
      const dcsTaskName = fg.task === 'CSAR' ? 'Transport' : fg.task

      // Find loadout
      let selectedLoadout = aircraftDef.loadouts.find((l) => l.task === taskName)

      if (!selectedLoadout) {
        // Fallback to default or first one
        selectedLoadout =
          aircraftDef.loadouts.find((l) => l.name === 'default' || l.task === 'default') ||
          aircraftDef.loadouts[0]
      }

      const pylons: Record<number, { CLSID: string; num: number }> = {}

      if (selectedLoadout && selectedLoadout.pylons) {
        selectedLoadout.pylons.forEach((p) => {
          if (p.num) {
            pylons[p.num] = { CLSID: p.CLSID, num: p.num }
          }
        })
      }

      // Get airdrome details if available
      const airdromeName = fg.homeBase
      const airdrome = theatre.airdromeDetails[airdromeName]

      // Initialize used slots for this airdrome if not exists
      if (airdrome && !usedParkingSlots.has(airdromeName)) {
        usedParkingSlots.set(airdromeName, new Set())
      }
      const airdromeUsedSlots = usedParkingSlots.get(airdromeName)

      // Check if the flight group is already in the air
      const inFlightState = calculateInFlightPosition(
        fg.flightplan,
        campaign.time,
        fg.task === 'CAP' ? config.packages.CAP.patrolDuration : undefined
      )
      const isInFlight = inFlightState !== null
      const airborneSpawnAltitude = inFlightState
        ? getAirborneSpawnAltitude(inFlightState.altitude, isHelicopter)
        : undefined

      if (isInFlight) {
        // eslint-disable-next-line no-console
        console.log(`Flight group ${fg.callsign} is already in the air, spawning airborne`)
      }

      // Add units
      const unitIds = flightGroupIdToUnitIds.get(fg.id) ?? fg.aircrafts.map(() => nextId())
      const link16NetworkUnitIds = coalitionLink16UnitIds.get(key) ?? unitIds
      const units: z.infer<typeof schemas.dcs.aircraftUnit>[] = fg.aircrafts.map((ac, index) => {
        const unitId = unitIds[index] ?? nextId()

        let parking: string | undefined = undefined
        let parking_id: string | undefined = undefined
        let x = fg.position.x + index * 50
        let y = fg.position.y + index * 50
        let alt = fg.flightplan.waypoints[0]?.altitude ?? 2000
        let heading = 0
        let speed = 150 // Default speed on ground

        if (isInFlight && inFlightState) {
          // Spawn in the air at current position
          x = inFlightState.position.x + index * 50 // Slight offset for formation
          y = inFlightState.position.y + index * 50
          alt = airborneSpawnAltitude ?? inFlightState.altitude
          heading = inFlightState.heading
          speed = fg.flightplan.waypoints[1]?.speed ?? 250 // Use cruise speed
          // No parking for airborne aircraft
        } else if (airdrome && airdromeUsedSlots) {
          // Spawn on the ground at parking slot
          const isHelicopter = aircraftDef.isHelicopter ?? false
          const isLarge = aircraftDef.isLarge ?? false

          const slot = Object.values(airdrome.standlist).find((s) => {
            if (airdromeUsedSlots.has(s.id)) return false
            if (s.blocked) return false

            if (isHelicopter && !s.helicopter) return false
            if (!isHelicopter && !s.plane) return false
            if (isLarge && !s.large) return false

            return true
          })

          if (slot) {
            parking = slot.crossroad_index.toString()
            parking_id = slot.id
            x = slot.x
            y = slot.y
            airdromeUsedSlots.add(slot.id)
          } else {
            // eslint-disable-next-line no-console
            console.warn(
              `No parking slot found for ${createAircraftUnitName(fg.callsign, index)} at ${airdromeName}`
            )
          }
        }

        return {
          alt: alt,
          alt_type: 'BARO',
          hardpoint_racks: true,
          heading: heading,
          callsign: createDcsCallsign(fg.callsign, index),
          psi: 0,
          onboard_num: '010',
          parking: parking,
          parking_id: parking_id,
          payload: {
            pylons: pylons,
            fuel: aircraftDef.max_fuel,
            flare: aircraftDef.flare,
            ammo_type: aircraftDef.ammo_type ?? 1,
            chaff: aircraftDef.chaff,
            gun: 100
          },
          AddPropAircraft: createAddPropAircraft(
            aircraftDef,
            fg.callsign,
            index,
            link16StationNumberByUnitId.get(unitId)
          ),
          datalinks: createDatalinks(aircraftDef, index, unitIds, link16NetworkUnitIds),
          livery_id: 'default',
          skill: ac.client ? 'Client' : 'High',
          speed: speed,
          type: aircraftDef.name,
          unitId: unitId,
          x: x,
          y: y,
          name: createAircraftUnitName(fg.callsign, index)
        }
      })

      const isTransportHelicopter = fg.task === 'Transport' && isHelicopter
      const transportCargo: { groupId: number; unitId: number; x: number; y: number }[] = []

      if (isTransportHelicopter) {
        if (!country.static) {
          country.static = { group: [] }
        }

        const baseX = units[0]?.x ?? fg.position.x
        const baseY = units[0]?.y ?? fg.position.y
        const cargoCount = Math.max(1, Math.min(4, Math.ceil((fg.cargoAmount ?? 1) / 200)))

        for (let i = 0; i < cargoCount; i += 1) {
          const offset = 12 + i * 6
          const cargoX = baseX + (i % 2 === 0 ? offset : -offset)
          const cargoY = baseY + (i % 2 === 0 ? offset : -offset)
          const cargoGroupId = nextId()
          const cargoUnitId = nextId()
          const cargoGroupName = `Static CDS Barrels-${cargoGroupId}`
          const cargoUnitName = `${cargoGroupName}-1`

          country.static.group.push({
            heading: 0,
            route: {
              points: [
                {
                  alt: 0,
                  type: '',
                  name: '',
                  y: cargoY,
                  speed: 0,
                  x: cargoX,
                  formation_template: '',
                  action: ''
                }
              ]
            },
            groupId: cargoGroupId,
            units: [
              {
                tasks: {},
                mass: 400,
                category: 'Cargos',
                canCargo: true,
                shape_name: 'cds_barrels',
                type: 'cds_barrels',
                unitId: cargoUnitId,
                rate: 1200,
                y: cargoY,
                x: cargoX,
                name: cargoUnitName,
                heading: 0
              }
            ],
            y: cargoY,
            x: cargoX,
            name: cargoGroupName,
            dead: false
          })

          transportCargo.push({
            groupId: cargoGroupId,
            unitId: cargoUnitId,
            x: cargoX,
            y: cargoY
          })
        }
      }

      // Calculate start time in seconds from midnight
      const flightStartTimeSeconds =
        fg.flightplan.startTime.getUTCHours() * 3600 +
        fg.flightplan.startTime.getUTCMinutes() * 60 +
        fg.flightplan.startTime.getUTCSeconds()

      const missionStartTime = mission.start_time

      // For in-flight aircraft, ETA starts from 0
      // For ground aircraft that are scheduled to start after mission start, delay them
      // For ground aircraft whose scheduled time has passed, start immediately (ETA = 0)
      let currentEta = 0
      if (!isInFlight) {
        const startDelay = flightStartTimeSeconds - missionStartTime
        // Only delay if the flight is scheduled for the future
        // If startDelay <= 0, the flight should start immediately
        currentEta = startDelay > 0 ? startDelay : 0
      }
      let lastWp: { x: number; y: number; speed: number } | undefined

      // For in-flight aircraft, filter out waypoints that have already been passed
      // and prepend a new waypoint at the current position
      let waypointsToUse = fg.flightplan.waypoints
      if (isInFlight && inFlightState) {
        // Keep only waypoints from nextWaypointIndex onwards
        waypointsToUse = fg.flightplan.waypoints.slice(inFlightState.nextWaypointIndex)
        // eslint-disable-next-line no-console
        console.log(
          `Removed ${inFlightState.nextWaypointIndex} past waypoints, ${waypointsToUse.length} remaining`
        )
      }

      const routePoints: z.infer<typeof schemas.dcs.aircraftRoutePoint>[] = []

      // For in-flight aircraft, add current position as the first waypoint
      if (isInFlight && inFlightState) {
        const nextWp = waypointsToUse[0]
        const currentTasks: z.infer<typeof schemas.dcs.task>[] = []
        if (fg.task === 'CAP' && inFlightState.capOrbit && inFlightState.capOrbit.remainingMs > 0) {
          currentTasks.push(
            createCapOrbitTask(
              inFlightState.capOrbit.racetrackStart,
              inFlightState.capOrbit.racetrackEnd,
              inFlightState.capOrbit.speed,
              inFlightState.capOrbit.altitude,
              inFlightState.capOrbit.remainingMs,
              currentTasks.length + 1
            )
          )
        }
        routePoints.push({
          alt: airborneSpawnAltitude ?? inFlightState.altitude,
          action: 'Turning Point',
          alt_type: 'BARO',
          speed: nextWp?.speed ?? 250,
          task: {
            id: 'ComboTask',
            params: {
              tasks: currentTasks
            }
          },
          type: 'Turning Point',
          x: inFlightState.position.x,
          y: inFlightState.position.y,
          ETA: 0,
          ETA_locked: true,
          speed_locked: true,
          formation_template: '',
          name: 'Current'
        })
        lastWp = {
          x: inFlightState.position.x,
          y: inFlightState.position.y,
          speed: nextWp?.speed ?? 250
        }
      }

      // Process remaining waypoints
      waypointsToUse.forEach((wp, index) => {
        let action = 'Turning Point'
        let type = 'Turning Point'

        if (wp.type === 'TakeOff') {
          // If already in flight, use Turning Point instead of a ground start
          if (!isInFlight) {
            if (isHelicopter && !airdrome) {
              action = hotStart ? 'From Ground Area Hot' : 'From Ground Area'
              type = hotStart ? 'TakeOffGroundHot' : 'TakeOffGround'
            } else {
              action = hotStart ? 'From Parking Area Hot' : 'From Parking Area'
              type = hotStart ? 'TakeOffParkingHot' : 'TakeOffParking'
            }
          }
        } else if (wp.type === 'Landing') {
          action = 'Landing'
          type = 'Land'
        }

        let x = wp.position.x
        let y = wp.position.y

        if (type === 'TakeOffParking' && index === 0 && units[0]) {
          x = units[0].x
          y = units[0].y
        }

        const alt = wp.altitude
        const altType = wp.altitudeType ?? 'BARO'

        // Calculate ETA
        let eta = currentEta
        if (lastWp) {
          const dist = Math.hypot(x - lastWp.x, y - lastWp.y)
          if (lastWp.speed > 0) {
            eta += dist / lastWp.speed
          }
        }
        currentEta = eta
        lastWp = { x: x, y: y, speed: wp.speed }

        const tasks: z.infer<typeof schemas.dcs.task>[] = []
        const nextWp = waypointsToUse[index + 1]

        // Add SEAD escort task for SEAD flight groups at their task waypoint
        // This makes the SEAD aircraft follow the strike group while engaging SAMs
        if (wp.type === 'Task' && fg.task === 'SEAD' && fg.packageId) {
          // Find the primary flight group in this package (the strike group to escort)
          const primaryFlightGroupId = packagePrimaryFlightGroupId.get(fg.packageId)
          if (primaryFlightGroupId) {
            const primaryDcsGroupId = flightGroupIdToGroupId.get(primaryFlightGroupId)
            if (primaryDcsGroupId) {
              tasks.push(createSEADEscortTask(primaryDcsGroupId, tasks.length + 1))
              // eslint-disable-next-line no-console
              console.log(
                `Added SEAD Escort task to ${fg.callsign} escorting group ID ${primaryDcsGroupId}`
              )
            }
          }
        }

        if (
          fg.task === 'CAP' &&
          wp.type === 'Task' &&
          nextWp?.type === 'RaceTrack End' &&
          config.packages.CAP.patrolDuration > 0
        ) {
          tasks.push(
            createCapOrbitTask(
              wp.position,
              nextWp.position,
              nextWp.speed,
              wp.altitude,
              config.packages.CAP.patrolDuration,
              tasks.length + 1
            )
          )
        }

        if (isTransportHelicopter && wp.type === 'TakeOff') {
          const transportUnit = units[0]
          if (transportUnit) {
            transportCargo.forEach((cargo) => {
              tasks.push({
                enabled: true,
                auto: false,
                id: 'CargoTransportationPlane',
                number: tasks.length + 1,
                params: {
                  y: cargo.y,
                  x: cargo.x,
                  unitIdTransport: transportUnit.unitId,
                  groupId: cargo.groupId,
                  unitId: cargo.unitId
                }
              })
            })
          }
        }

        if (isTransportHelicopter && wp.name === 'Direct') {
          transportCargo.forEach((cargo) => {
            tasks.push({
              enabled: true,
              auto: false,
              id: 'CargoUnloadPlane',
              number: tasks.length + 1,
              params: {
                groupId: cargo.groupId,
                unitId: cargo.unitId
              }
            })
          })
        }

        if (wp.name === 'Target' && fg.target && fg.task === 'Pinpoint Strike') {
          const targetStructure = structureMap.get(fg.target.id)

          if (targetStructure) {
            targetStructure.buildings.forEach((building) => {
              tasks.push({
                enabled: true,
                auto: false,
                id: 'Bombing',
                number: tasks.length + 1,
                params: {
                  direction: 0,
                  attackQtyLimit: false,
                  attackQty: 1,
                  expend: 'Auto',
                  y: targetStructure.position.y + building.offset.y,
                  directionEnabled: false,
                  groupAttack: false,
                  altitude: 6000,
                  altitudeEnabled: false,
                  weaponType: 4030478,
                  x: targetStructure.position.x + building.offset.x
                }
              })
            })
          }
        }

        const routePointIndex = routePoints.length
        const routePoint: z.infer<typeof schemas.dcs.aircraftRoutePoint> = {
          alt: alt,
          action,
          alt_type: altType,
          speed: wp.speed,
          task: {
            id: 'ComboTask',
            params: {
              tasks: tasks
            }
          },
          type,
          x: x,
          y: y,
          ETA: eta,
          ETA_locked: routePointIndex === 0, // First waypoint must have locked time
          speed_locked: true,
          formation_template: '',
          name: wp.name
        }

        if (
          (type === 'TakeOffParking' || type === 'TakeOffParkingHot') &&
          airdrome?.id &&
          !isInFlight
        ) {
          routePoint.airdromeId = airdrome.id
        }

        routePoints.push(routePoint)
      })

      if (aircraftDef.name === 'F-16C_50') {
        ensureFirstWaypointEplrs(routePoints, groupId)
      }

      const group = {
        groupId: groupId,
        name: groupName, // Group Name
        start_time: 0,
        task: dcsTaskName,
        uncontrollable: false,
        uncontrolled: false,
        tasks: [],
        taskSelected: true,
        hiddenOnMFD: false,
        hiddenOnPlanner: false,
        radioSet: false,
        units: units,
        x: units[0]?.x ?? fg.position.x,
        y: units[0]?.y ?? fg.position.y,
        route: {
          points: routePoints
        },
        modulation: 0,
        hidden: false,
        communication: true,
        frequency: assignFlightGroupFrequency(aircraftDef)
      }

      if (isHelicopter) {
        country.helicopter?.group.push(group)
      } else {
        country.plane?.group.push(group)
      }

      if (fg.aircrafts.some((ac) => ac.client)) {
        const targetPosition = resolveTargetPosition(campaign, theatre, fg)
        const downedPilot = value.downedPilots?.find((pilot) => pilot.id === fg.target?.id)
        const landingAirdrome = theatre.airdromeDetails[fg.homeBase]
        let navigation: MissionNavigationConfig | undefined

        if (navigationFeatures.vectors && landingAirdrome) {
          navigation = {
            ...navigation,
            mode: 'landingAirport',
            landingLabel: landingAirdrome.name,
            landingPoint: {
              x: landingAirdrome.x,
              z: landingAirdrome.y
            },
            ...(landingAirdrome.tacan ? { landingTacan: landingAirdrome.tacan } : {})
          }
        }

        if ((navigationFeatures.vectors || navigationFeatures.targetTacan) && targetPosition) {
          navigation = {
            ...navigation,
            mode: navigationFeatures.targetTacan ? 'targetTacan' : 'targetVector',
            ...(navigationFeatures.vectors ? { targetLabel: formatTargetLabel(fg) } : {}),
            ...(navigationFeatures.vectors
              ? {
                  targetPoint: {
                    x: targetPosition.x,
                    z: targetPosition.y
                  }
                }
              : {})
          }

          if (navigationFeatures.targetTacan) {
            const channel = nextTacanChannel++
            const callsign = `DCC${nextTacanCallsign++}`
            const beaconName = `DCC Target TACAN ${groupName}`

            navigation = {
              ...navigation,
              mode: 'targetTacan',
              targetLabel: navigation.targetLabel ?? formatTargetLabel(fg),
              tacan: {
                channel,
                band: 'X',
                callsign
              }
            }

            vehicleGroups.push(
              createTargetTacanGroup({
                groupId: nextId(),
                unitId: nextId(),
                name: beaconName,
                position: targetPosition,
                channel,
                callsign
              })
            )
          }
        }

        flightConfigs.push({
          groupId,
          name: groupName,
          task: fg.task,
          unitNames: units.map((unit) => unit.name),
          ...(isHelicopter ? { isHelicopter } : {}),
          ...(fg.task === 'CSAR' && downedPilot
            ? {
                csar: {
                  pilotId: downedPilot.id,
                  pilotName: downedPilot.name,
                  position: downedPilot.position,
                  pickupRadius: config.packages.CSAR.pickupRadius
                }
              }
            : {}),
          ...(navigation ? { navigation } : {})
        })
      }

      if (casJtac && fg.task === 'CAS' && fg.aircrafts.some((ac) => ac.client) && fg.target) {
        const enemyCoalition = key === 'player' ? 'opponent' : 'player'
        const enemyMissionCoalitionKey = enemyCoalition === 'player' ? 'blue' : 'red'
        const targetGroundGroup = campaign.coalitions[enemyCoalition].groundGroups.find(
          (groundGroup) => groundGroup.id === fg.target?.id
        )
        const targetObjective = theatre.objectives.find(
          (objective) => objective.name === fg.target?.objectiveId
        )
        const targetPosition = targetGroundGroup?.position ?? targetObjective?.position

        if (targetGroundGroup && targetPosition) {
          const targetGroupName = findMissionGroundGroupName(
            mission,
            enemyMissionCoalitionKey,
            targetGroundGroup.id
          )

          if (targetGroupName) {
            const jtacName = addJtacPredator({
              country,
              nextId,
              targetId: targetGroundGroup.id,
              targetPosition,
              groupId
            })

            const existingConfig = flightConfigs.find((config) => config.name === groupName)
            if (existingConfig) {
              Object.assign(existingConfig, {
                task: 'CAS',
                jtacName,
                targetGroupName,
                laserCode: JTAC_LASER_CODE
              })
            }
          }
        }
      }
    })
  }

  return ok(flightConfigs)
}
