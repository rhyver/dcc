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

export function addFlightGroups(
  mission: z.infer<typeof schemas.dcs.mission>,
  campaign: z.infer<typeof schemas.campaign.campaign>,
  theatre: z.infer<typeof schemas.theatre>
): Result<void, Error> {
  const nextId = () => {
    mission.currentKey += 1
    return mission.currentKey
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

      // Calculate start time in seconds from midnight
      // Campaign time is likely irrelevant if we assume flight plan starts relative to mission start?
      // Or we should use the campaign time.
      // For now, let's assume flight plan start time is correct.
      // We need to convert date to seconds of day.
      const startTime =
        fg.flightplan.startTime.getHours() * 3600 +
        fg.flightplan.startTime.getMinutes() * 60 +
        fg.flightplan.startTime.getSeconds()

      const routePoints = fg.flightplan.waypoints.map((wp, index) => {
        let action = 'Turning Point'
        let type = 'Turning Point'

        if (wp.type === 'TakeOff') {
          action = 'From Parking Area'
          type = 'TakeOffParking'
        } else if (wp.type === 'Landing') {
          action = 'Landing'
          type = 'Land'
        }

        return {
          alt: wp.altitude,
          action,
          alt_type: 'BARO', // Default to BARO
          speed: wp.speed,
          task: {
            id: 'ComboTask',
            params: {
              tasks: []
            }
          },
          type,
          x: wp.position.x,
          y: wp.position.y,
          ETA: 0, // Should calculate?
          ETA_locked: index === 0, // First waypoint must have locked time
          speed_locked: true,
          formation_template: ''
        }
      })

      // Get airdrome details if available
      const airdromeName = fg.homeBase
      const airdrome = theatre.airdromeDetails[airdromeName]

      // Initialize used slots for this airdrome if not exists
      if (airdrome && !usedParkingSlots.has(airdromeName)) {
        usedParkingSlots.set(airdromeName, new Set())
      }
      const airdromeUsedSlots = usedParkingSlots.get(airdromeName)

      // Add units
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const units: any[] = fg.aircrafts.map((ac, index) => {
        const unitId = nextId()

        let parking = '1'
        let parking_id = null
        let x = fg.position.x + index * 50
        let y = fg.position.y + index * 50

        if (airdrome && airdromeUsedSlots) {
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
            parking = slot.id
            parking_id = null
            x = slot.x
            y = slot.y
            airdromeUsedSlots.add(slot.id)
          } else {
            // eslint-disable-next-line no-console
            console.warn(`No parking slot found for ${ac.unitName} at ${airdromeName}`)
          }
        }

        return {
          alt: fg.flightplan.waypoints[0]?.altitude ?? 2000,
          alt_type: 'BARO',
          hardpoint_racks: true,
          heading: 0,
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
          skill: 'High',
          speed: 150, // Default speed
          type: aircraftDef.name,
          unitId: unitId,
          x: x,
          y: y,
          name: ac.unitName
        }
      })

      const group = {
        groupId: groupId,
        name: groupName, // Group Name
        start_time: startTime,
        task: fg.task,
        uncontrollable: false,
        units: units,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        x: units[0]?.x ?? fg.position.x,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        y: units[0]?.y ?? fg.position.y,
        route: {
          points: routePoints
        },
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
