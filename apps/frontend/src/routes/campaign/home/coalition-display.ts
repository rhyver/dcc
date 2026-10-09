import type { schemas } from '@dcc/contracts'
import type * as z from 'zod'

type Coalition = z.infer<typeof schemas.coalition>
export type PlayerSide = z.infer<typeof schemas.campaign.campaign>['playerSide']

export function getCoalitionSide(coalition: Coalition, playerSide: PlayerSide = 'blue') {
  const side = playerSide ?? 'blue'
  return coalition === 'player' ? side : side === 'blue' ? 'red' : 'blue'
}

export function getCoalitionColor(coalition: Coalition, playerSide?: PlayerSide) {
  return getCoalitionSide(coalition, playerSide) === 'blue' ? '#00ddff' : '#ff4d4f'
}
