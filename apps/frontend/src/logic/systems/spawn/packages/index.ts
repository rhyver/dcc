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
import { spawnCsar } from './csar'

export function spawnPackages(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>,
  policy: Partial<AtoPlannerPolicy> = {}
) {
  const context = resolveSpawnContext(draft, coalition)
  if (!context) return
  spawnCsar(draft, coalition)
  const tempo = draft.operationProfile?.tempo ?? 'standard'
  const tempoPolicy: Partial<AtoPlannerPolicy> =
    tempo === 'cautious'
      ? { maxNewPackagesPerLogicTick: 1, maxActiveAircraft: 22 }
      : tempo === 'surge'
        ? { maxNewPackagesPerLogicTick: 3, maxActiveAircraft: 34 }
        : {}

  const result = planAtoPackages(draft, coalition, context, {
    ...defaultAtoPlannerPolicy,
    ...tempoPolicy,
    enableTransport: featureFlags.transportFlightGroups,
    ...policy
  })
  commitAtoPackages(draft, coalition, result.admitted)
  enforcePackageStartSpacing(draft, coalition)
}
