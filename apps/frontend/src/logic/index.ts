import { activeStore } from '@/stores/active'
import { debugLog } from '@/lib/debug'
import { applyFastTick, applyLogicTick } from './campaign-tick'

export function fastTick(delta: number) {
  activeStore.send({
    type: 'tick',
    delta,
    logic: (draft) => applyFastTick(draft, delta)
  })
}

export function logicTick(delta: number) {
  debugLog('logic tick', delta)
  const start = performance.now()

  activeStore.send({
    type: 'tick',
    delta,
    logic: (draft) => applyLogicTick(draft, delta)
  })

  const end = performance.now()
  debugLog(`tick duration: ${end - start}ms`)
}
