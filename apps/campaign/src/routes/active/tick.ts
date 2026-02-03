import { activeStore } from '@/stores/active'
import { useSelector } from '@xstate/store/react'
import { logicTick, fastTick } from '@/logic'
import { useEffect, useRef } from 'react'
import { addMilliseconds, differenceInMilliseconds } from 'date-fns'

function updateTime(delta: number) {
  activeStore.trigger.updateTime({
    time: addMilliseconds(
      activeStore.getSnapshot().context.time,
      delta * activeStore.getSnapshot().context.timeMultiplier
    )
  })

  const state = activeStore.getSnapshot().context
  if (state.timeTarget && state.timeMultiplier > 0) {
    const nextTime = addMilliseconds(state.time, delta * state.timeMultiplier)
    if (nextTime >= state.timeTarget) {
      activeStore.trigger.updateTime({ time: state.timeTarget })
      activeStore.trigger.updateTimeMultiplier({ timeMultiplier: 0 })
      activeStore.trigger.setTimeTarget({ timeTarget: undefined })
    }
  }
}
export function useTick() {
  const time = useSelector(activeStore, (state) => state.context.time)
  const timeMultiplier = useSelector(activeStore, (state) => state.context.timeMultiplier)

  const prevTickDateRef = useRef<Date | null>(null)
  const prevLogicTickDateRef = useRef<Date | null>(null)
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
  function getLogicTickDelta() {
    const now = new Date()
    if (prevLogicTickDateRef.current == null) {
      prevLogicTickDateRef.current = now
      return 0
    }
    const delta = differenceInMilliseconds(now, prevLogicTickDateRef.current)
    if (delta >= 1000) {
      prevLogicTickDateRef.current = now
    }
    return delta
  }

  const tickDisabled = time == null || timeMultiplier === 0

  useEffect(() => {
    if (tickDisabled) {
      return
    }
    prevTickDateRef.current = new Date()
    const interval = setInterval(() => {
      const delta = getTickDelta()
      const logicDelta = getLogicTickDelta()
      if (logicDelta >= 1000) {
        logicTick(logicDelta)
      }
      updateTime(delta)
      fastTick(delta)
    }, 16)
    return () => {
      clearInterval(interval)
    }
  }, [tickDisabled])
}
