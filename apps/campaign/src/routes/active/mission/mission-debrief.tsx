import { Crosshair, ShieldAlert, Target } from 'lucide-react'
import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type MissionState = z.infer<typeof schemas.missionState>
type LostUnit = MissionState['lostUnits'][number]
type DebriefSide = 'blue' | 'red' | 'unknown'

export type MissionDebrief = {
  submittedAt: Date
  missionState: MissionState
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

function getLostUnitField(unit: LostUnit, key: string): unknown {
  return (unit as Record<string, unknown>)[key]
}

function normalizeCoalition(value: unknown): DebriefSide {
  if (value === 'blue' || value === 2) return 'blue'
  if (value === 'red' || value === 1) return 'red'
  return 'unknown'
}

function getLostUnitSide(unit: LostUnit): DebriefSide {
  return normalizeCoalition(getLostUnitField(unit, 'coalition'))
}

function getLostUnitText(unit: LostUnit, key: string): string | null {
  const value = getLostUnitField(unit, key)
  return typeof value === 'string' && value.length > 0 ? value : null
}

function formatLossType(unit: LostUnit): string {
  const lossType = getLostUnitText(unit, 'lossType') ?? getLostUnitText(unit, 'event')
  if (!lossType) return 'lost'
  return lossType.replace(/_/g, ' ')
}

function groupLostUnitsBySide(lostUnits: LostUnit[]) {
  return lostUnits.reduce<Record<DebriefSide, LostUnit[]>>(
    (groups, unit) => {
      groups[getLostUnitSide(unit)].push(unit)
      return groups
    },
    { blue: [], red: [], unknown: [] }
  )
}

export function MissionDebriefScreen({
  debrief,
  onClose
}: {
  debrief: MissionDebrief
  onClose: () => void
}) {
  const lostBySide = groupLostUnitsBySide(debrief.missionState.lostUnits ?? [])
  const totalLost = debrief.missionState.lostUnits?.length ?? 0
  const submittedTime = formatTime(debrief.submittedAt)

  const columns: Array<{
    side: DebriefSide
    label: string
    border: string
    accent: string
    icon: typeof ShieldAlert
  }> = [
    {
      side: 'blue',
      label: 'Blue Losses',
      border: 'border-[#00ddff]/35',
      accent: 'text-[#00ddff]',
      icon: ShieldAlert
    },
    {
      side: 'red',
      label: 'Red Losses',
      border: 'border-[#ff3366]/40',
      accent: 'text-[#ff3366]',
      icon: Crosshair
    },
    {
      side: 'unknown',
      label: 'Unassigned',
      border: 'border-white/20',
      accent: 'text-white/60',
      icon: Target
    }
  ]

  return (
    <div className="min-h-screen bg-[#0b0014] text-white">
      <div
        className="fixed inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0,221,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,51,102,0.08) 1px, transparent 1px)',
          backgroundSize: '44px 44px'
        }}
      />
      <div className="fixed inset-x-0 bottom-0 h-[34vh] bg-gradient-to-t from-[#00ddff]/20 via-[#ff3366]/10 to-transparent" />

      <div className="relative z-10 flex min-h-screen flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.35em] text-white/45">
              Mission Debrief
            </div>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.16em] text-white">
              Submitted Results
            </h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/55">
              <span>{submittedTime} UTC</span>
              <span>{totalLost} total units lost</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-[#00ddff]/40 bg-transparent text-[#00ddff] hover:bg-[#00ddff]/10"
            onClick={onClose}
          >
            Continue
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
          {columns.map(({ side, label, border, accent, icon: Icon }) => {
            const units = lostBySide[side]
            return (
              <section
                key={side}
                className={cn(
                  'flex min-h-[320px] flex-col rounded-lg border bg-black/35 p-4 backdrop-blur-sm',
                  border
                )}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Icon className={cn('h-5 w-5', accent)} />
                  <span className="text-sm font-semibold uppercase tracking-[0.18em]">
                    {label}
                  </span>
                  <span className={cn('ml-auto text-2xl font-black tabular-nums', accent)}>
                    {units.length}
                  </span>
                </div>

                <div className="min-h-0 flex-1 overflow-auto space-y-2">
                  {units.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded border border-white/10 bg-white/[0.03] text-sm text-white/35">
                      No losses recorded
                    </div>
                  ) : (
                    units.map((unit, index) => (
                      <div
                        key={`${unit.name}-${index}`}
                        className="rounded border border-white/10 bg-white/[0.04] px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">
                              {unit.name}
                            </div>
                            <div className="truncate text-xs text-white/45">{unit.type}</div>
                          </div>
                          <div className="shrink-0 rounded border border-white/10 px-2 py-1 text-[11px] uppercase tracking-wider text-white/55">
                            {formatLossType(unit)}
                          </div>
                        </div>
                        {(getLostUnitText(unit, 'killerPlayerName') ||
                          getLostUnitText(unit, 'weaponName')) && (
                          <div className="mt-2 truncate text-xs text-white/45">
                            {getLostUnitText(unit, 'killerPlayerName') ?? 'Unknown'}{' '}
                            {getLostUnitText(unit, 'weaponName')
                              ? `with ${getLostUnitText(unit, 'weaponName')}`
                              : ''}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
