import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { debugLog } from '@/lib/debug'

import { updateCampaignGoal } from './systems/campaign-goal'
import { removeDestroyedStructures } from './systems/remove-destroyed-structures'
import { spawn } from './systems/spawn'
import { updateFlightGroups } from './systems/update-flight-groups'
import { updateGroundGroups } from './systems/update-ground-groups'
import { updatePackages } from './systems/update-packages'
import { updateResources } from './systems/update-resources'
import { updateSupply } from './systems/update-supply'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>

const activeCoalitions: Coalition[] = ['player', 'opponent']

function forEachActiveCoalition(callback: (coalition: Coalition) => void) {
  for (const coalition of activeCoalitions) {
    callback(coalition)
  }
}

function isCampaignActive(draft: Campaign) {
  return (draft.status ?? 'active') === 'active'
}

export function applyFastTick(draft: Campaign, delta: number) {
  if (!isCampaignActive(draft)) return

  debugLog('fast tick', draft.time)

  forEachActiveCoalition((coalition) => updateFlightGroups(draft, coalition))
  forEachActiveCoalition((coalition) => updatePackages(draft, coalition))
  forEachActiveCoalition((coalition) => removeDestroyedStructures(draft, coalition))
  forEachActiveCoalition((coalition) =>
    updateGroundGroups(draft, coalition, delta, { capture: false })
  )
  updateCampaignGoal(draft)
}

export function applyLogicTick(draft: Campaign, delta: number) {
  if (!isCampaignActive(draft)) return

  forEachActiveCoalition((coalition) => updateResources(draft, coalition))
  forEachActiveCoalition((coalition) => updateSupply(draft, coalition, delta))
  forEachActiveCoalition((coalition) =>
    updateGroundGroups(draft, coalition, delta, { move: false })
  )
  forEachActiveCoalition((coalition) => spawn(draft, coalition))
  updateCampaignGoal(draft)
}
