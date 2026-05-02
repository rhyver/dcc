import { activeStore } from '@/stores/active'
import { spawn } from './systems/spawn'
import { updateFlightGroups } from './systems/update-flight-groups'
import { updatePackages } from './systems/update-packages'
import { removeDestroyedStructures } from './systems/remove-destroyed-structures'
import { updateResources } from './systems/update-resources'
import { updateGroundGroups } from './systems/update-ground-groups'
import { updateSupply } from './systems/update-supply'
import { debugLog } from '@/lib/debug'
import { updateCampaignGoal } from './systems/campaign-goal'

export function fastTick(delta: number) {
  activeStore.send({
    type: 'tick',
    delta,
    logic: (draft) => {
      if ((draft.status ?? 'active') !== 'active') return
      debugLog('fast tick', draft.time)
      updateFlightGroups(draft, 'player')
      updateFlightGroups(draft, 'opponent')
      updatePackages(draft, 'player')
      updatePackages(draft, 'opponent')
      removeDestroyedStructures(draft, 'player')
      removeDestroyedStructures(draft, 'opponent')
      updateGroundGroups(draft, 'player', delta, { capture: false })
      updateGroundGroups(draft, 'opponent', delta, { capture: false })
      updateCampaignGoal(draft)
    }
  })
}

export function logicTick(delta: number) {
  debugLog('logic tick', delta)
  const start = performance.now()

  activeStore.send({
    type: 'tick',
    delta,
    logic: (draft) => {
      if ((draft.status ?? 'active') !== 'active') return
      updateResources(draft, 'player')
      updateResources(draft, 'opponent')
      updateSupply(draft, 'player')
      updateSupply(draft, 'opponent')
      updateGroundGroups(draft, 'player', delta, { move: false })
      updateGroundGroups(draft, 'opponent', delta, { move: false })
      spawn(draft, 'player')
      spawn(draft, 'opponent')
      updateCampaignGoal(draft)
    }
  })

  const end = performance.now()
  debugLog(`tick duration: ${end - start}ms`)
}
