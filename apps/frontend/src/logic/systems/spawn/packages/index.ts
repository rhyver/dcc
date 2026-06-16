import type { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { featureFlags } from '@/lib/feature-flags'
import { enforcePackageStartSpacing } from './package-start-spacing'
import {
  commitAtoPackages,
  defaultAtoPlannerPolicy,
  planAtoPackages,
  type AtoPlannerPolicy
} from './ato-planner'
import { resolveSpawnContext } from './common'

export function spawnPackages(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>,
  policy: Partial<AtoPlannerPolicy> = {}
) {
  const context = resolveSpawnContext(draft, coalition)
  if (!context) return

  const result = planAtoPackages(draft, coalition, context, {
    ...defaultAtoPlannerPolicy,
    enableTransport: featureFlags.transportFlightGroups,
    ...policy
  })
  commitAtoPackages(draft, coalition, result.admitted)
  enforcePackageStartSpacing(draft, coalition)
}
