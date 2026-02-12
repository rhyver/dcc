import { schemas, config } from '@dcc/contracts'
import { aircrafts } from '@dcc/data'
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

  const getHeading = (from: z.infer<typeof schemas.position>, to: z.infer<typeof schemas.position>) =>
    Math.atan2(to.x - from.x, to.y - from.y)

  const racetrackStartIndex =
    patrolDurationMs && patrolDurationMs > 0
      ? waypoints.findIndex((wp, idx) => wp.type === 'Task' && waypoints[idx + 1]?.type === 'RaceTrack End')
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
        const patrolLegElapsed = patrolForwardLeg ? patrolEndCyclePos : patrolEndCyclePos - legTimeMs
        const patrolRatio = legTimeMs > 0 ? patrolLegElapsed / legTimeMs : 0
        const patrolFrom = patrolForwardLeg ? racetrackStart : racetrackEnd
        const patrolTo = patrolForwardLeg ? racetrackEnd : racetrackStart
        let currentPos = getPositionAlong(patrolFrom.position, patrolTo.position, patrolRatio)
        let currentAlt = patrolFrom.altitude + (patrolTo.altitude - patrolFrom.altitude) * patrolRatio

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

export function addFlightGroups(
  mission: z.infer<typeof schemas.dcs.mission>,
  campaign: z.infer<typeof schemas.campaign.campaign>,
  theatre: z.infer<typeof schemas.theatre>
): Result<void, Error> {
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

  // First pass: Pre-assign DCS group IDs to all flight groups
  // This is needed so SEAD flights can reference their escort target's groupId
  const flightGroupIdToGroupId = new Map<string, number>()
  for (const [, value] of Object.entries(campaign.coalitions)) {
    const flightGroups = value.flightGroups
    if (!flightGroups) continue

    for (const fg of flightGroups) {
      const groupId = nextId()
      flightGroupIdToGroupId.set(fg.id, groupId)
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

  for (const [key, value] of Object.entries(campaign.coalitions)) {
    const missionCoalitionKey = key === 'player' ? 'blue' : key === 'opponent' ? 'red' : 'neutrals'
    const flightGroups = value.flightGroups

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

      if (isInFlight) {
        // eslint-disable-next-line no-console
        console.log(`Flight group ${fg.callsign} is already in the air, spawning airborne`)
      }

      // Add units
      const units: z.infer<typeof schemas.dcs.aircraftUnit>[] = fg.aircrafts.map((ac, index) => {
        const unitId = nextId()

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
          alt = inFlightState.altitude
          heading = inFlightState.heading
          speed = fg.flightplan.waypoints[1]?.speed ?? 250 // Use cruise speed
          // No parking for airborne aircraft
        } else if (airdrome && airdromeUsedSlots) {
          // Spawn on the ground at parking slot
          const isHelicopter = aircraftDef.isHelicopter ?? false
          const isLarge = aircraftDef.isLarge ?? false

          const slot = Object.values(airdrome.standlist).find((s) => {
            if (airdromeUsedSlots.has(s.id)) return false

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
            console.warn(`No parking slot found for ${ac.unitName} at ${airdromeName}`)
          }
        }

        return {
          alt: alt,
          alt_type: 'BARO',
          hardpoint_racks: true,
          heading: heading,
          callsign: {
            _1: 1,
            _2: 1,
            name: 'Enfield11', // Placeholder
            _3: 1
          },
          psi: 0,
          onboard_num: '010',
          parking: parking,
          parking_id: parking_id,
          payload: {
            pylons: pylons,
            fuel: aircraftDef.max_fuel,
            flare: aircraftDef.flare,
            ammo_type: 1,
            chaff: aircraftDef.chaff,
            gun: 100
          },
          livery_id: 'default',
          skill: ac.client ? 'Client' : 'High',
          speed: speed,
          type: aircraftDef.name,
          unitId: unitId,
          x: x,
          y: y,
          name: ac.unitName
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
          alt: inFlightState.altitude,
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
          // If already in flight, use Turning Point instead of TakeOffParking
          if (!isInFlight) {
            action = 'From Parking Area'
            type = 'TakeOffParking'
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

        // Add SEAD escort task for SEAD flight groups at the IP waypoint
        // This makes the SEAD aircraft follow the strike group while engaging SAMs
        if (wp.name === 'IP' && fg.task === 'SEAD' && fg.packageId) {
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

        if (wp.name === 'IP' && fg.target && fg.task === 'Pinpoint Strike') {
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
          alt_type: 'BARO', // Default to BARO
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

        if (type === 'TakeOffParking' && airdrome?.id && !isInFlight) {
          routePoint.airdromeId = airdrome.id
        }

        routePoints.push(routePoint)
      })

      const group = {
        groupId: groupId,
        name: groupName, // Group Name
        start_time: 0,
        task: fg.task,
        uncontrollable: false,
        units: units,
        x: units[0]?.x ?? fg.position.x,
        y: units[0]?.y ?? fg.position.y,
        route: {
          points: routePoints
        },
        modulation: false,
        hidden: false,
        communication: true,
        frequency: 124.0
      }

      if (isHelicopter) {
        country.helicopter?.group.push(group)
      } else {
        country.plane?.group.push(group)
      }
    })
  }

  return ok()
}
