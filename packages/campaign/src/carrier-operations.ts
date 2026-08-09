import { schemas } from '@dcc/contracts'
import * as z from 'zod'

type Aircraft = z.infer<typeof schemas.dcs.aircraft>
type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>

export const HMS_INVINCIBLE_UNIT_TYPE = 'hms_invincible'
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

  const invincibleGroup = (campaign.coalitions[coalition].navalGroups ?? []).find(
    (group) =>
      group.role === 'carrier' &&
      group.state !== 'sunk' &&
      group.unitTypes.includes(HMS_INVINCIBLE_UNIT_TYPE)
  )
  if (!invincibleGroup) return false

  let changed = false
  if (!invincibleGroup.unitTypes.some((unitType) => SUPERCARRIER_UNIT_TYPES.has(unitType))) {
    invincibleGroup.unitTypes.push(DEFAULT_SUPERCARRIER_UNIT_TYPE)
    changed = true
  }
  if (
    invincibleGroup.units &&
    !invincibleGroup.units.some((unit) => SUPERCARRIER_UNIT_TYPES.has(unit.type))
  ) {
    invincibleGroup.units.push({
      id: `${invincibleGroup.id}-supercarrier`,
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
