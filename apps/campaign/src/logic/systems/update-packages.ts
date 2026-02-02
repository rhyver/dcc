import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export function updatePackages(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  const packages = draft.coalitions[coalition].packages
  const flightGroups = draft.coalitions[coalition].flightGroups

  // Get set of active flight group IDs
  const activeFlightGroupIds = new Set(flightGroups.map((fg) => fg.id))

  // Mark packages as completed when all member flights have landed (no longer in flightGroups)
  for (const pkg of packages) {
    if (pkg.status === 'completed') {
      continue
    }

    const allMembersLanded = pkg.members.every(
      (member) => !activeFlightGroupIds.has(member.flightGroupId)
    )

    if (allMembersLanded) {
      pkg.status = 'completed'
      console.log(`Package ${pkg.id} (${pkg.type}) completed - all flights landed`)
    }
  }

  // Remove completed packages
  draft.coalitions[coalition].packages = packages.filter((pkg) => pkg.status !== 'completed')
}
