import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export function removeDestroyedStructures(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  draft.coalitions[coalition].structures = draft.coalitions[coalition].structures.filter(
    (structure) => structure.buildings.some((b) => b.alive)
  )
}
