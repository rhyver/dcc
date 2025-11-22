import { activeStore } from '@/stores/active'
import { useSelector } from '@xstate/store/react'
import { useEffect, useRef } from 'react'
import { addMilliseconds, differenceInMilliseconds } from 'date-fns'

function updateTime(delta: number) {
  activeStore.trigger.updateTime({
    time: addMilliseconds(
      activeStore.getSnapshot().context.time,
      delta * activeStore.getSnapshot().context.timeMultiplier
    )
  })
}
export function useTick() {
  const time = useSelector(activeStore, (state) => state.context.time)
  const timeMultiplier = useSelector(activeStore, (state) => state.context.timeMultiplier)

  const prevTickDateRef = useRef<Date | null>(null)
  function getTickDelta() {
    const now = new Date()
    if (prevTickDateRef.current == null) {
      prevTickDateRef.current = now
      return 0
    }
    const delta = differenceInMilliseconds(now, prevTickDateRef.current)
    prevTickDateRef.current = now
    return delta
  }

  useEffect(() => {
    if (time == null || timeMultiplier === 0) {
      return
    }
    prevTickDateRef.current = new Date()
    const interval = setInterval(() => {
      const delta = getTickDelta()
      updateTime(delta)
    }, 16)
    return () => clearInterval(interval)
  }, [time, timeMultiplier])
}
