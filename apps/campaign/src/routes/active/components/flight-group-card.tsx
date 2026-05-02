import { Clock, Crosshair, PlaneTakeoff, User } from 'lucide-react'
import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { getAircraftDisplayName } from '@/lib/aircraft-display'
import { cn } from '@/lib/utils'

type FlightGroup = z.infer<typeof schemas.flightGroup>

interface FlightGroupCardProps {
  group: FlightGroup
  isAirborne?: boolean
  selected?: boolean
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

function formatTime(date: Date | string) {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }).format(d)
}

export function FlightGroupCard({
  group,
  isAirborne = false,
  selected = false,
  onClick,
  onMouseEnter,
  onMouseLeave
}: FlightGroupCardProps) {
  const hasClients = group.aircrafts.some((aircraft) => aircraft.client)
  const clientCount = group.aircrafts.filter((aircraft) => aircraft.client).length

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded border p-2 transition-colors',
        onClick && 'cursor-pointer',
        isAirborne
          ? selected
            ? 'border-amber-400 bg-amber-400/10'
            : 'border-amber-400/40 bg-amber-400/5 hover:bg-amber-400/10'
          : selected
            ? hasClients
              ? 'border-cyan-400 bg-cyan-500/20'
              : 'border-synthwave-pink bg-synthwave-pink/20'
            : hasClients
              ? 'border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20'
              : 'border-synthwave-pink/10 bg-synthwave-pink/5 hover:bg-synthwave-pink/10'
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span
            className={cn('text-sm font-medium', hasClients ? 'text-cyan-300' : 'text-primary')}
          >
            {group.callsign}
          </span>
          {isAirborne && (
            <span className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
              <PlaneTakeoff className="h-2.5 w-2.5" />
              Airborne
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-[10px] text-secondary/70">
          <div className="flex items-center gap-1" title="Start Time">
            <Clock className="h-3 w-3" />
            <span>{formatTime(group.flightplan.startTime)}</span>
          </div>
          {group.tot && (
            <div className="flex items-center gap-1" title="Time Over Target">
              <Crosshair className="h-3 w-3" />
              <span>{formatTime(group.tot)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="rounded-full border border-secondary/20 bg-secondary/10 px-1.5 py-0.5 text-xs text-secondary/80">
          {group.task}
        </span>
        <div className="flex items-center gap-2 text-[10px] text-secondary/60">
          <span>
            {group.aircrafts.length}{' '}
            {group.aircrafts[0]
              ? getAircraftDisplayName(group.aircrafts[0].aircraftName)
              : 'Unknown'}
          </span>
          <div
            className={cn('flex items-center gap-1', hasClients && 'text-cyan-300')}
            title="Client slots"
          >
            <User className="h-3 w-3" />
            <span>{clientCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
