import { Check, Clock3, Plane } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

import { AircraftRoster } from './start-aircraft-roster'
import {
  eraOptions,
  factionIdsByEra,
  getFactionAircraft,
  type CampaignEra,
  type Faction,
  type Scenario,
  type ScenarioStep
} from './start-campaign-options'

type CampaignStepProps = {
  scenario: Scenario
  step: Exclude<ScenarioStep, 'scenario'>
  selectedEra: CampaignEra
  factions: Faction[]
  selectedPlayerFactionId: string
  selectedOpponentFactionId: string
  campaignYear: number
  isCreatingCampaign: boolean
  forceGpsEnabledDate: boolean
  onSelectEra: (era: CampaignEra) => void
  onSelectPlayerFaction: (factionId: string) => void
  onSelectOpponentFaction: (factionId: string) => void
  onForceGpsEnabledDateChange: (force: boolean) => void
  onCustomizeFaction: (role: 'player' | 'opponent') => void
  onCreateFaction: (role: 'player' | 'opponent') => void
  onCustomizeFactions: () => void
  onCreateCampaign: () => void
}

export function CampaignStep({
  scenario,
  step,
  selectedEra,
  factions,
  selectedPlayerFactionId,
  selectedOpponentFactionId,
  campaignYear,
  isCreatingCampaign,
  forceGpsEnabledDate,
  onSelectEra,
  onSelectPlayerFaction,
  onSelectOpponentFaction,
  onForceGpsEnabledDateChange,
  onCustomizeFaction,
  onCreateFaction,
  onCustomizeFactions,
  onCreateCampaign
}: CampaignStepProps) {
  const [activeFactionRole, setActiveFactionRole] = useState<'player' | 'opponent'>('player')
  const selectedEraOption = eraOptions.find((era) => era.id === selectedEra) ?? eraOptions[0]!
  const selectedPlayerFaction = factions.find((faction) => faction.id === selectedPlayerFactionId)
  const selectedOpponentFaction = factions.find(
    (faction) => faction.id === selectedOpponentFactionId
  )
  const playerAircraft = getFactionAircraft(selectedPlayerFaction)
  const activeFaction =
    activeFactionRole === 'player' ? selectedPlayerFaction : selectedOpponentFaction
  const factionsDiffer = selectedPlayerFactionId !== selectedOpponentFactionId

  return (
    <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="synthwave-scrollbar grid min-h-0 content-start gap-2.5 overflow-x-hidden overflow-y-auto pr-2 [scrollbar-gutter:stable]">
        {step === 'era' ? (
          eraOptions.map((era) => {
            const isSelected = era.id === selectedEra
            const eraDefaults = factionIdsByEra[era.id]

            return (
              <div
                key={era.id}
                className={cn(
                  'group flex flex-col rounded-md border text-left transition-all',
                  '[min-height:clamp(7rem,16.5vh,12rem)]',
                  'bg-synthwave-dark/78 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur',
                  isSelected
                    ? 'border-synthwave-pink text-white shadow-[0_0_32px_rgba(255,0,170,0.24)]'
                    : 'border-synthwave-purple/45 text-synthwave-light hover:border-synthwave-cyan hover:bg-synthwave-purple/10'
                )}
              >
                <button
                  type="button"
                  className="flex w-full flex-col p-[clamp(0.875rem,1.7vh,1.25rem)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-synthwave-cyan"
                  onClick={() => onSelectEra(era.id)}
                >
                  <div className="mb-[clamp(0.5rem,1.3vh,1rem)] flex w-full items-start justify-between gap-3">
                    <div>
                      <div className="retro-font text-[clamp(1.25rem,2.35vh,1.5rem)] tracking-wide">
                        {era.label}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-synthwave-cyan/75">
                        <Clock3 className="h-3.5 w-3.5" />
                        {era.callsign}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded border px-2 py-1 text-xs',
                        isSelected
                          ? 'border-synthwave-pink/70 text-synthwave-pink'
                          : 'border-synthwave-purple/50 text-synthwave-light/55'
                      )}
                    >
                      {isSelected ? 'SELECTED' : 'AVAILABLE'}
                    </span>
                  </div>
                  <p className="text-sm leading-[clamp(1.25rem,2.45vh,1.5rem)] text-synthwave-light/68">
                    {era.description}
                  </p>
                </button>
                <div className="flex items-center gap-2 border-t border-synthwave-purple/25 px-[clamp(0.875rem,1.7vh,1.25rem)] py-2.5">
                  <Plane className="h-3.5 w-3.5 text-synthwave-cyan/60" />
                  <span className="text-[0.65rem] uppercase tracking-[0.18em] text-synthwave-light/40">
                    {factions.find((faction) => faction.id === eraDefaults.player)?.name}
                  </span>
                </div>
              </div>
            )
          })
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {(
              [
                {
                  role: 'player' as const,
                  label: 'PLAYER',
                  selectedId: selectedPlayerFactionId,
                  onSelect: onSelectPlayerFaction
                },
                {
                  role: 'opponent' as const,
                  label: 'OPPONENT',
                  selectedId: selectedOpponentFactionId,
                  onSelect: onSelectOpponentFaction
                }
              ] as const
            ).map((column) => (
              <div key={column.role} className="flex min-h-0 flex-col">
                <div className="retro-font sticky top-0 z-10 bg-synthwave-dark/95 pb-2 text-sm tracking-wide text-synthwave-cyan backdrop-blur-sm">
                  {column.label}
                </div>
                <div className="grid gap-2">
                  {factions.map((faction) => {
                    const isSelected = faction.id === column.selectedId
                    const isActive = isSelected && activeFactionRole === column.role
                    const isConflict =
                      column.role === 'opponent'
                        ? faction.id === selectedPlayerFactionId
                        : faction.id === selectedOpponentFactionId

                    return (
                      <button
                        key={`${column.role}-${faction.id}`}
                        type="button"
                        className={cn(
                          'rounded-md border p-3 text-left transition-all',
                          'bg-synthwave-dark/78 backdrop-blur',
                          isSelected
                            ? isActive
                              ? 'border-synthwave-pink text-white shadow-[inset_3px_0_0_var(--synthwave-pink),0_0_24px_rgba(255,0,170,0.2)]'
                              : 'border-synthwave-cyan/80 bg-synthwave-cyan/[0.06] text-white shadow-[inset_3px_0_0_var(--synthwave-cyan),0_0_20px_rgba(0,255,255,0.12)]'
                            : 'border-synthwave-purple/45 text-synthwave-light hover:border-synthwave-cyan hover:bg-synthwave-purple/10',
                          isConflict && !isSelected && 'opacity-45'
                        )}
                        onClick={() => {
                          setActiveFactionRole(column.role)
                          column.onSelect(faction.id)
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="retro-font text-base tracking-wide">{faction.name}</div>
                            <div className="mt-1 text-xs text-synthwave-cyan/75">
                              {faction.year != null ? `YEAR ${faction.year}` : faction.id}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {isSelected ? (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[0.58rem] uppercase tracking-wider',
                                  isActive
                                    ? 'border-synthwave-pink/60 bg-synthwave-pink/10 text-synthwave-pink'
                                    : 'border-synthwave-cyan/60 bg-synthwave-cyan/10 text-synthwave-cyan'
                                )}
                              >
                                <Check className="h-2.5 w-2.5" />
                                Selected
                              </span>
                            ) : null}
                            <span
                              className={cn(
                                'rounded border px-2 py-0.5 text-[0.6rem] uppercase tracking-wider',
                                faction.color === 'blue'
                                  ? 'border-synthwave-cyan/50 text-synthwave-cyan'
                                  : 'border-synthwave-pink/50 text-synthwave-pink'
                              )}
                            >
                              {faction.color}
                            </span>
                          </div>
                        </div>
                        {faction.id.startsWith('custom-') ? (
                          <div className="mt-2 text-[0.58rem] uppercase tracking-[0.18em] text-synthwave-pink/75">
                            Custom faction
                          </div>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AircraftRoster
        scenario={scenario}
        step={step}
        eraLabel={selectedEraOption.label}
        playerFaction={selectedPlayerFaction}
        opponentFaction={selectedOpponentFaction}
        playerFactionId={selectedPlayerFactionId}
        campaignYear={campaignYear}
        aircraft={playerAircraft}
        isCreatingCampaign={isCreatingCampaign}
        forceGpsEnabledDate={forceGpsEnabledDate}
        factionsDiffer={factionsDiffer}
        selectedFaction={activeFaction}
        onCustomizeFactions={onCustomizeFactions}
        onForceGpsEnabledDateChange={onForceGpsEnabledDateChange}
        onCustomizeSelectedFaction={() => onCustomizeFaction(activeFactionRole)}
        onCreateSelectedFaction={() => onCreateFaction(activeFactionRole)}
        onCreateCampaign={onCreateCampaign}
      />
    </div>
  )
}
