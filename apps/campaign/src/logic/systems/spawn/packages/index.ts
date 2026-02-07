import type { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { spawnStrike } from './strike'
import { spawnDead } from './dead'
import { spawnCap } from './cap'
import { spawnTransport } from './transport'

export function spawnPackages(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  // CAP first - defend airspace
  spawnCap(draft, coalition)
  // Then offensive missions
  spawnStrike(draft, coalition)
  spawnDead(draft, coalition)
  // Logistics support
  spawnTransport(draft, coalition)
}
