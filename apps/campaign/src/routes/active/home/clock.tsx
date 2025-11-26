import { activeStore } from '@/stores/active'
import { useSelector } from '@xstate/store/react'
import { format } from 'date-fns'

export function Clock() {
  const time = useSelector(activeStore, (state) => state.context.time)
  return time == null ? null : (
    <div className="flex items-center gap-2 text-sm text-synthwave-purple">
      <span className="retro-font">{format(time, 'yyyy-MM-dd HH:mm:ss')}</span>
    </div>
  )
}
