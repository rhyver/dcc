import { schemas } from '@dcc/contracts'
import * as z from 'zod'

type Aircraft = z.infer<typeof schemas.dcs.aircraft>
type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>

export const HMS_INVINCIBLE_UNIT_TYPE = 'hms_invincible'
export const LHA_TARAWA_UNIT_TYPE = 'LHA_Tarawa'
export const HARRIER_CARRIER_UNIT_TYPES = new Set([HMS_INVINCIBLE_UNIT_TYPE, LHA_TARAWA_UNIT_TYPE])
export const DEFAULT_SUPERCARRIER_UNIT_TYPE = 'CVN_71'
export const SUPERCARRIER_UNIT_TYPES = new Set(['CVN_71', 'CVN_72', 'CVN_73', 'CVN_75'])

export function requiresSupercarrier(
  aircraft: Pick<Aircraft, 'carrierCapable' | 'isHelicopter' | 'name'>
) {
  return aircraft.carrierCapable && !aircraft.isHelicopter && aircraft.name !== 'AV8BNA'
}

export function ensureSupercarrierForAircraft(
  campaign: Campaign,
  coalition: Coalition,
  aircraft: Pick<Aircraft, 'carrierCapable' | 'isHelicopter' | 'name'>
) {
  if (!requiresSupercarrier(aircraft)) return false

  const carrierGroup = (campaign.coalitions[coalition].navalGroups ?? []).find(
    (group) =>
      group.role === 'carrier' &&
      group.state !== 'sunk' &&
      group.unitTypes.some((unitType) => HARRIER_CARRIER_UNIT_TYPES.has(unitType))
  )
  if (!carrierGroup) return false

  let changed = false
  if (!carrierGroup.unitTypes.some((unitType) => SUPERCARRIER_UNIT_TYPES.has(unitType))) {
    carrierGroup.unitTypes.push(DEFAULT_SUPERCARRIER_UNIT_TYPE)
    changed = true
  }
  if (
    carrierGroup.units &&
    !carrierGroup.units.some((unit) => SUPERCARRIER_UNIT_TYPES.has(unit.type))
  ) {
    carrierGroup.units.push({
      id: `${carrierGroup.id}-supercarrier`,
      type: DEFAULT_SUPERCARRIER_UNIT_TYPE,
      damage: 0,
      ammunition: 1,
      fuel: 1,
      state: 'operational'
    })
    changed = true
  }

  return changed
}

/**
 * Adds a Supercarrier to Harrier carrier groups that host fixed-wing carrier aircraft, however the
 * flight was planned. Without it, mission generation cannot place those flights.
 */
export function ensureSupercarriersForFlightGroups(
  campaign: Campaign,
  findAircraft: (
    aircraftName: string
  ) => Pick<Aircraft, 'carrierCapable' | 'isHelicopter' | 'name'> | undefined
) {
  let changed = false
  for (const coalition of ['player', 'opponent'] as const) {
    const { flightGroups, navalGroups } = campaign.coalitions[coalition]
    for (const flightGroup of flightGroups) {
      const homeCarrier = navalGroups?.find(
        (group) =>
          group.id === flightGroup.homeBase &&
          group.role === 'carrier' &&
          group.unitTypes.some((unitType) => HARRIER_CARRIER_UNIT_TYPES.has(unitType))
      )
      if (!homeCarrier) continue

      for (const aircraft of flightGroup.aircrafts) {
        const definition = findAircraft(aircraft.aircraftName)
        if (definition && ensureSupercarrierForAircraft(campaign, coalition, definition)) {
          changed = true
        }
      }
    }
  }
  return changed
}
