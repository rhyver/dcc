import { schemas } from '@dcc/contracts'
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
 * Calculate current position along the flight path based on elapsed time.
 * Returns null if the flight hasn't taken off yet.
 * Also returns the index of the next waypoint the aircraft is heading toward.
 */
function calculateInFlightPosition(
  flightplan: z.infer<typeof schemas.flightplan>,
  campaignTime: Date
): {
  position: z.infer<typeof schemas.position>
  altitude: number
  heading: number
  nextWaypointIndex: number
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

      const groupId = nextId()
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
      const inFlightState = calculateInFlightPosition(fg.flightplan, campaign.time)
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

      // Calculate start time in seconds from midnight
      // Campaign time is likely irrelevant if we assume flight plan starts relative to mission start?
      // Or we should use the campaign time.
      // For now, let's assume flight plan start time is correct.
      // We need to convert date to seconds of day.
      const startTime =
        fg.flightplan.startTime.getUTCHours() * 3600 +
        fg.flightplan.startTime.getUTCMinutes() * 60 +
        fg.flightplan.startTime.getUTCSeconds()

      const missionStartTime = mission.start_time

      const startDelay = startTime - missionStartTime

      // For in-flight aircraft, ETA starts from 0; for ground aircraft, add 10 min startup delay
      let currentEta = isInFlight ? 0 : startDelay + 10 * 60
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
        routePoints.push({
          alt: inFlightState.altitude,
          action: 'Turning Point',
          alt_type: 'BARO',
          speed: nextWp?.speed ?? 250,
          task: {
            id: 'ComboTask',
            params: {
              tasks: []
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

        if (wp.name === 'IP' && fg.target) {
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
