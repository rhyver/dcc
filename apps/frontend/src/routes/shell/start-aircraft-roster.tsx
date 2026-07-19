import { BookOpen, Bot, Gamepad2, Plane } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type {
  CampaignEra,
  Faction,
  FactionAircraft,
  Scenario,
  ScenarioStep
} from './start-campaign-options'
import { formatFactionLabel } from './start-campaign-options'

type AircraftRosterProps = {
  scenario: Scenario
  step: Exclude<ScenarioStep, 'scenario'>
  eraLabel: CampaignEra | string
  playerFaction: Faction | undefined
  opponentFaction: Faction | undefined
  playerFactionId: string
  aircraft: FactionAircraft[]
  isCreatingCampaign: boolean
  factionsDiffer: boolean
  onCustomizeFactions: () => void
  onCreateCampaign: () => void
}

export function AircraftRoster({
  scenario,
  step,
  eraLabel,
  playerFaction,
  opponentFaction,
  playerFactionId,
  aircraft,
  isCreatingCampaign,
  factionsDiffer,
  onCustomizeFactions,
  onCreateCampaign
}: AircraftRosterProps) {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-md border border-synthwave-pink/35 bg-black/30 shadow-[0_0_44px_rgba(255,0,170,0.14)] backdrop-blur">
      <div className="border-b border-synthwave-purple/30 p-5">
        <div className="mb-2 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-synthwave-pink">
          <Plane className="h-3.5 w-3.5" />
          Aircraft roster
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="retro-font text-xl text-white">
              {playerFaction ? formatFactionLabel(playerFaction) : 'Player faction'}
            </div>
            <div className="mt-1 text-xs text-synthwave-cyan/75">
              {eraLabel}
              {opponentFaction ? ` // vs ${formatFactionLabel(opponentFaction)}` : ''}
            </div>
          </div>
          <span className="rounded border border-synthwave-cyan/35 px-2 py-1 text-[0.65rem] text-synthwave-cyan">
            {aircraft.length} TYPES
          </span>
        </div>
      </div>

      <div className="synthwave-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 [scrollbar-gutter:stable]">
        <motion.div
          key={playerFactionId}
          className="grid gap-2"
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {aircraft.map((entry) => (
            <div
              key={entry.name}
              className="relative rounded border border-synthwave-purple/30 bg-synthwave-dark/55 p-3"
            >
              <div className="absolute inset-y-0 left-0 w-0.5 bg-synthwave-cyan/65" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">{entry.displayName}</div>
                  {entry.displayName !== entry.name ? (
                    <div className="mt-0.5 truncate font-mono text-[0.6rem] text-synthwave-light/35">
                      {entry.name}
                    </div>
                  ) : null}
                </div>
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[0.55rem] uppercase tracking-wider',
                    entry.controllable
                      ? 'border-synthwave-pink/50 text-synthwave-pink'
                      : 'border-synthwave-cyan/30 text-synthwave-cyan/65'
                  )}
                >
                  {entry.controllable ? (
                    <Gamepad2 className="h-2.5 w-2.5" />
                  ) : (
                    <Bot className="h-2.5 w-2.5" />
                  )}
                  {entry.controllable ? 'Player' : 'AI'}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="rounded bg-synthwave-purple/18 px-1.5 py-0.5 text-[0.58rem] text-synthwave-light/50">
                  {entry.isHelicopter ? 'HELICOPTER' : 'FIXED WING'}
                </span>
                {entry.isMod ? (
                  <span className="rounded border border-synthwave-pink/40 bg-synthwave-pink/10 px-1.5 py-0.5 text-[0.58rem] text-synthwave-pink">
                    MOD
                  </span>
                ) : null}
                {entry.roles.slice(0, 2).map((role) => (
                  <span
                    key={role}
                    className="rounded bg-synthwave-purple/18 px-1.5 py-0.5 text-[0.58rem] text-synthwave-light/50"
                  >
                    {role.toUpperCase()}
                  </span>
                ))}
                {entry.roles.length > 2 ? (
                  <span className="group/roles relative inline-flex cursor-default rounded bg-synthwave-purple/18 px-1.5 py-0.5 text-[0.58rem] text-synthwave-cyan/60">
                    +{entry.roles.length - 2}
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute top-full left-0 z-30 mt-1.5 flex w-max max-w-52 flex-wrap gap-1 rounded border border-synthwave-purple/50 bg-black/95 px-2 py-1.5 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.55)] transition-opacity group-hover/roles:opacity-100"
                    >
                      {entry.roles.slice(2).map((role) => (
                        <span
                          key={role}
                          className="rounded bg-synthwave-purple/25 px-1.5 py-0.5 text-[0.58rem] text-synthwave-light/80"
                        >
                          {role.toUpperCase()}
                        </span>
                      ))}
                    </span>
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="border-t border-synthwave-purple/30 p-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs">
          <span className="truncate text-synthwave-light/50">
            {scenario.name} // {scenario.theatreName}
          </span>
          <span className="shrink-0 text-synthwave-pink">{eraLabel}</span>
        </div>
        {step === 'era' ? (
          <Button
            type="button"
            variant="outline"
            className="mb-2 h-10 w-full border-synthwave-purple bg-synthwave-dark/80 text-synthwave-cyan hover:border-synthwave-pink hover:bg-synthwave-purple/10 hover:text-white"
            onClick={onCustomizeFactions}
            disabled={isCreatingCampaign}
          >
            Customize Factions
          </Button>
        ) : null}
        <Button
          type="button"
          className="h-11 w-full bg-synthwave-pink text-white hover:bg-synthwave-pink/85"
          onClick={onCreateCampaign}
          disabled={isCreatingCampaign || !scenario.available || !factionsDiffer}
        >
          <BookOpen className="h-4 w-4" />
          {isCreatingCampaign ? 'CREATING' : 'CREATE CAMPAIGN'}
        </Button>
      </div>
    </aside>
  )
}
