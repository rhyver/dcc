import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { spawnGroundGroups } from './ground-groups'
import { spawnPackages } from './packages'

export function spawn(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  spawnPackages(draft, coalition)
  spawnGroundGroups(draft, coalition)
}
