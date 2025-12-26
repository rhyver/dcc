import { activeStore } from '@/stores/active'
import { useSelector } from '@xstate/store/react'

export function Clock() {
  const time = useSelector(activeStore, (state) => state.context.time)

  if (time == null) return null

  const formattedTime = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  })
    .format(new Date(time))
    .replace(', ', ' ')

  return (
    <div className="flex items-center gap-2 text-lg text-secondary">
      <span className="retro-font">{formattedTime}</span>
    </div>
  )
}
