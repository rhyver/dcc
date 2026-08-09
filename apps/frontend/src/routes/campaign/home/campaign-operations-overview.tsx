import {
  Activity,
  Anchor,
  Cross,
  MapPinned,
  PackageOpen,
  Route,
  ShieldAlert,
  UsersRound
} from 'lucide-react'
import { useSelector } from '@xstate/store/react'
import {
  getGroundGroupCombatPower,
  evaluateCombatViability,
  getSanCarlosLandingReadiness
} from '@dcc/campaign'
import { theatres } from '@dcc/data'

import { activeStore } from '@/stores/active'
import { cn } from '@/lib/utils'

type GroundGroup = ReturnType<
  typeof activeStore.getSnapshot
>['context']['coalitions']['player']['groundGroups'][number]

function formationStrength(group: GroundGroup) {
  const baseline = group.baselineCombatPower ?? getGroundGroupCombatPower(group)
  return baseline > 0 ? getGroundGroupCombatPower(group) / baseline : 0
}

function percent(value: number) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`
}

function statusTone(state: string) {
  if (state === 'sunk' || state === 'trapped') return 'text-red-300'
  if (state === 'damaged' || state === 'withdrawing' || state === 'awaiting-extraction') {
    return 'text-amber-300'
  }
  return 'text-cyan-300'
}

export function CampaignOperationsOverview() {
  const campaign = useSelector(activeStore, (state) => state.context)
  const player = campaign.coalitions.player
  const formations = player.groundGroups
  const navalGroups = player.navalGroups ?? []
  const casualtyPoints = player.casualtyPoints ?? []
  const extractionRequests = player.extractionRequests ?? []
  const replacementPools = Object.values(player.replacementPools ?? {})
  const isFalklands = campaign.scenarioId === 'falklands-1982'
  const theatre = isFalklands
    ? theatres.find((candidate) => candidate.name === 'SouthAtlantic')
    : undefined
  const landingReadiness = theatre ? getSanCarlosLandingReadiness(campaign, theatre) : undefined
  const recoveringPersonnel = replacementPools.reduce(
    (sum, pool) => sum + pool.recoveringPersonnel.reduce((count, entry) => count + entry.count, 0),
    0
  )
  const readyPersonnel = replacementPools.reduce((sum, pool) => sum + pool.readyPersonnel, 0)
  const storedEquipment = replacementPools.reduce((sum, pool) => sum + pool.equipment.length, 0)
  const recoveringFormations = formations.filter((group) =>
    ['withdrawing', 'awaiting-extraction', 'trapped'].includes(group.state)
  )
  const deferred = formations.filter((group) => group.deploymentDeferredReason)

  if (
    !isFalklands &&
    navalGroups.length === 0 &&
    casualtyPoints.length === 0 &&
    extractionRequests.length === 0 &&
    recoveringFormations.length === 0
  ) {
    return null
  }

  return (
    <section className="tactical-inset mx-2 mb-2 shrink-0 overflow-hidden rounded-md text-synthwave-light">
      <div className="flex items-center justify-between border-b border-synthwave-pink/15 bg-black/20 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-synthwave-pink" />
          <span className="retro-font text-xs uppercase text-primary">Campaign operations</span>
        </div>
        {isFalklands && (
          <span className="rounded-sm border border-synthwave-cyan/25 bg-synthwave-cyan/8 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-cyan-200">
            {campaign.campaignPhase === 'sea-control'
              ? 'sea control & landing preparation'
              : (campaign.campaignPhase?.replaceAll('-', ' ') ?? 'sea control')}
          </span>
        )}
      </div>

      {isFalklands && landingReadiness && campaign.campaignPhase !== 'land-campaign' && (
        <div className="border-b border-synthwave-pink/12 px-3 py-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wide">
            <span className="flex items-center gap-1.5 text-secondary/70">
              <MapPinned className="h-3 w-3 text-synthwave-pink" /> San Carlos readiness
            </span>
            <span className={landingReadiness.ready ? 'text-cyan-300' : 'text-amber-300'}>
              {landingReadiness.ready ? 'Cleared' : `${landingReadiness.reasons.length} holds`}
            </span>
          </div>
          {campaign.landingOperation?.completesAt ? (
            <div className="text-xs text-cyan-200">
              Unloading until{' '}
              {new Intl.DateTimeFormat('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC'
              }).format(campaign.landingOperation.completesAt)}{' '}
              Z
            </div>
          ) : (
            <div className="line-clamp-2 text-[11px] leading-relaxed text-secondary/70">
              {landingReadiness.reasons[0] ??
                'Carrier, escort, lift, suppression, and sites ready.'}
            </div>
          )}
        </div>
      )}

      {navalGroups.length > 0 && (
        <div className="grid grid-cols-3 gap-px border-b border-synthwave-pink/12 bg-synthwave-pink/10">
          {navalGroups.map((group) => (
            <div key={group.id} className="min-w-0 bg-black/30 px-2 py-2">
              <div className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-wide text-secondary/55">
                <Anchor className="h-3 w-3 text-synthwave-pink" /> {group.role}
              </div>
              <div
                className={cn('truncate text-[11px] font-medium', statusTone(group.state))}
                title={group.name}
              >
                {group.name}
              </div>
              <div className="mt-0.5 text-[9px] tabular-nums text-secondary/55">
                {percent(1 - group.damage)} capability
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-px bg-synthwave-pink/10">
        {[
          [Route, 'Withdraw', recoveringFormations.length],
          [
            Cross,
            'Casualties',
            casualtyPoints.filter((point) => point.status === 'awaiting-pickup').length
          ],
          [
            UsersRound,
            'Extract',
            extractionRequests.filter((request) => request.status === 'awaiting-aircraft').length
          ],
          [PackageOpen, 'Pool', readyPersonnel + recoveringPersonnel + storedEquipment]
        ].map(([Icon, label, value]) => {
          const MetricIcon = Icon as typeof Route
          return (
            <div key={label as string} className="bg-black/25 px-2 py-2 text-center">
              <MetricIcon className="mx-auto mb-1 h-3 w-3 text-synthwave-pink" />
              <div className="text-sm tabular-nums text-cyan-200">{value as number}</div>
              <div className="text-[8px] uppercase tracking-wide text-secondary/50">
                {label as string}
              </div>
            </div>
          )
        })}
      </div>

      {(recoveringFormations.length > 0 || deferred.length > 0) && (
        <div className="space-y-1 border-t border-synthwave-pink/12 px-3 py-2">
          {recoveringFormations.slice(0, 2).map((group) => {
            const viability = evaluateCombatViability(group)
            return (
              <div key={group.id} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="flex min-w-0 items-center gap-1.5 truncate text-secondary/70">
                  <ShieldAlert className="h-3 w-3 shrink-0 text-amber-300" />
                  {group.authorizedTemplateId ?? group.id.slice(0, 8)}
                </span>
                <span className={cn('shrink-0 tabular-nums', statusTone(group.state))}>
                  {group.state} · {percent(formationStrength(group))} · {viability.unitCount}
                </span>
              </div>
            )
          })}
          {deferred.slice(0, 1).map((group) => (
            <div
              key={group.id}
              className="truncate text-[9px] text-amber-200/80"
              title={group.deploymentDeferredReason}
            >
              Site deferred: {group.deploymentDeferredReason}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
