import type { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { spawnStrike } from './strike'

export function spawnPackages(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  spawnStrike(draft, coalition)
}
