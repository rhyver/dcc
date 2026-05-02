import { activeStore } from '@/stores/active'
import { useSelector } from '@xstate/store/react'

export function Clock() {
  const time = useSelector(activeStore, (state) => state.context.time)

  if (time == null) return null

  const date = new Date(time)
  const formattedTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }).format(date)
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC'
  })
    .format(date)
    .toUpperCase()

  return (
    <div className="flex flex-col items-center justify-center text-secondary">
      <span className="retro-font text-lg leading-none">{formattedTime}</span>
      <span className="retro-font mt-1 text-xs leading-none">
        {formattedDate}
      </span>
    </div>
  )
}
