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
