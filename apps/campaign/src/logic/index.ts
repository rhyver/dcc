import { activeStore } from '@/stores/active'
import { spawn } from './systems/spawn'

export function logicTick(delta: number) {
  console.log('logic tick', delta)
  const start = performance.now()

  activeStore.send({
    type: 'tick',
    delta,
    logic: (draft) => {
      spawn(draft, 'player')
      spawn(draft, 'opponent')
    }
  })

  const end = performance.now()
  console.log(`tick duration: ${end - start}ms`)
}
