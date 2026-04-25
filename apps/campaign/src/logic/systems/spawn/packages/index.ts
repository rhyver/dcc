import type { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { spawnStrike } from './strike'
import { spawnDead } from './dead'
import { spawnCap } from './cap'
import { spawnCas } from './cas'
import { spawnTransport } from './transport'
import { featureFlags } from '@/lib/feature-flags'

export function spawnPackages(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  // CAP first - defend airspace
  spawnCap(draft, coalition)
  // Then offensive missions
  spawnStrike(draft, coalition)
  spawnDead(draft, coalition)
  spawnCas(draft, coalition)
  // Logistics support
  if (featureFlags.transportFlightGroups) {
    spawnTransport(draft, coalition)
  }
}
