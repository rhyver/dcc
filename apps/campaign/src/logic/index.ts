import { spawn } from './systems/spawn'

export function logicTick(delta: number) {
  console.log('logic tick', delta)
  const start = performance.now()
  spawn('player')
  spawn('opponent')
  const end = performance.now()
  console.log(`tick duration: ${end - start}ms`)
}
