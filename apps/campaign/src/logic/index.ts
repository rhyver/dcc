import { activeStore } from '@/stores/active'
import { spawn } from './systems/spawn'
import { updateFlightGroups } from './systems/update-flight-groups'
import { removeDestroyedStructures } from './systems/remove-destroyed-structures'
import { updateResources } from './systems/update-resources'

export function fastTick(delta: number) {
  activeStore.send({
    type: 'tick',
    delta,
    logic: (draft) => {
      updateFlightGroups(draft, 'player')
      updateFlightGroups(draft, 'opponent')
      removeDestroyedStructures(draft, 'player')
      removeDestroyedStructures(draft, 'opponent')
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
      updateResources(draft, 'player')
      updateResources(draft, 'opponent')
      spawn(draft, 'player')
      spawn(draft, 'opponent')
    }
  })

  const end = performance.now()
  console.log(`tick duration: ${end - start}ms`)
}
