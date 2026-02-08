import { activeStore } from '@/stores/active'
import { spawn } from './systems/spawn'
import { updateFlightGroups } from './systems/update-flight-groups'
import { updatePackages } from './systems/update-packages'
import { removeDestroyedStructures } from './systems/remove-destroyed-structures'
import { updateResources } from './systems/update-resources'
import { updateGroundGroups } from './systems/update-ground-groups'
import { updateSupply } from './systems/update-supply'

export function fastTick(delta: number) {
  activeStore.send({
    type: 'tick',
    delta,
    logic: (draft) => {
      console.log('fast tick', draft.time)
      updateFlightGroups(draft, 'player')
      updateFlightGroups(draft, 'opponent')
      updatePackages(draft, 'player')
      updatePackages(draft, 'opponent')
      removeDestroyedStructures(draft, 'player')
      removeDestroyedStructures(draft, 'opponent')
      updateGroundGroups(draft, 'player', delta, { capture: false })
      updateGroundGroups(draft, 'opponent', delta, { capture: false })
    }
  })
}

export function logicTick(delta: number) {
  console.log('logic tick', delta)
  const start = performance.now()

  activeStore.send({
    type: 'tick',
    delta,
    logic: (draft) => {
      updateResources(draft, 'player', delta)
      updateResources(draft, 'opponent', delta)
      updateSupply(draft, 'player')
      updateSupply(draft, 'opponent')
      updateGroundGroups(draft, 'player', delta)
      updateGroundGroups(draft, 'opponent', delta)
      spawn(draft, 'player')
      spawn(draft, 'opponent')
    }
  })

  const end = performance.now()
  console.log(`tick duration: ${end - start}ms`)
}
