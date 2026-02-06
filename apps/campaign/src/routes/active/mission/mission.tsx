import { useEffect, useMemo, useState } from 'react'
import { useSelector } from '@xstate/store/react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock, CloudSun, Plane, Sun, Target, Wind } from 'lucide-react'
import { useNavigate } from 'react-router'
import { produce } from 'immer'
import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { activeStore } from '@/stores/active'
import { coreClient, orpc } from '@/lib/orpc'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'

const KNOTS_PER_MS = 1.94384

function formatTime(date: Date | string) {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }).format(d)
}

function formatWindDirection(degrees: number) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const
  const index = Math.round(degrees / 45) % directions.length
  return `${degrees.toFixed(0)}° ${directions[index]}`
}

type Campaign = z.infer<typeof schemas.campaign.campaign>
type MissionState = z.infer<typeof schemas.missionState>

function applyMissionStateUpdate(campaign: Campaign, missionState: MissionState): Campaign {
  const lostUnitNames = new Set(missionState.lostUnits?.map((unit) => unit.name) ?? [])
  const groupPositions = missionState.groupPositions

  return produce(campaign, (draft) => {
    const applyToCoalition = (
      coalition: 'player' | 'opponent',
      groups?: Array<{ name: string; x: number; y: number }>
    ) => {
      if (!groups) {
        return
      }

      const groupByName = new Map(groups.map((group) => [group.name, group]))

      for (const flightGroup of draft.coalitions[coalition].flightGroups) {
        const missionGroup = groupByName.get(flightGroup.callsign)
        if (missionGroup) {
          flightGroup.position.x = missionGroup.x
          flightGroup.position.y = missionGroup.y
        }

        if (lostUnitNames.size > 0) {
          flightGroup.aircrafts = flightGroup.aircrafts.filter(
            (aircraft) => !lostUnitNames.has(aircraft.unitName)
          )
        }
      }
    }

    applyToCoalition('player', groupPositions?.blue?.aircraft)
    applyToCoalition('opponent', groupPositions?.red?.aircraft)
  })
}

export function Mission() {
  const navigate = useNavigate()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: 'error' } | null>(null)
  const scenarioId = useSelector(activeStore, (state) => state.context.scenarioId)
  const campaignTime = useSelector(activeStore, (state) => state.context.time)
  const timeMultiplier = useSelector(activeStore, (state) => state.context.timeMultiplier)
  const hotStart = useSelector(activeStore, (state) => state.context.campaignParams?.hotStart)
  const playerPackages = useSelector(
    activeStore,
    (state) => state.context.coalitions.player.packages
  )
  const playerFlightGroups = useSelector(
    activeStore,
    (state) => state.context.coalitions.player.flightGroups
  )

  const scenarioQuery = useQuery(
    orpc.data.getScenario.queryOptions({
      input: scenarioId
    })
  )
  const theatreQuery = useQuery(
    orpc.data.getTheatre.queryOptions({
      input: scenarioQuery.data?.theatreName ?? '',
      enabled: scenarioQuery.data != null
    })
  )

  const activePackages = useMemo(
    () => playerPackages.filter((pkg) => pkg.status === 'active'),
    [playerPackages]
  )
  const missionPackages = activePackages.length > 0 ? activePackages : playerPackages
  const objectivesByName = useMemo(() => {
    if (!theatreQuery.data) return new Map<string, { name: string; type: string }>()
    return new Map(theatreQuery.data.objectives.map((objective) => [objective.name, objective]))
  }, [theatreQuery.data])

  const clientFlightGroups = useMemo(
    () => playerFlightGroups.filter((group) => group.aircrafts.some((ac) => ac.client)),
    [playerFlightGroups]
  )

  const weather = theatreQuery.data?.info.weather
  const scenario = scenarioQuery.data

  const handleGenerate = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    try {
      await coreClient.campaign.generateMiz(activeStore.getSnapshot().context)
      setIsGenerated(true)
    } catch (error) {
      console.error('Failed to generate mission', error)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeout = window.setTimeout(() => {
      setToast(null)
    }, 4000)

    return () => window.clearTimeout(timeout)
  }, [toast])

  const handleSubmitMissionState = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const missionState = await coreClient.campaign.loadMissionState()
      const currentCampaign = activeStore.getSnapshot().context

      if (missionState.missionId !== currentCampaign.id) {
        const message = `Mission state mismatch. Expected ${currentCampaign.id}, got ${missionState.missionId}.`
        console.error(message)
        setToast({ message, tone: 'error' })
        return
      }

      const updatedCampaign = applyMissionStateUpdate(currentCampaign, missionState)
      activeStore.send({ type: 'loadCampaign', campaign: updatedCampaign })
      await coreClient.campaign.saveActiveCampaign(updatedCampaign)
      navigate('/')
    } catch (error) {
      console.error('Failed to submit mission state', error)
      const message =
        error instanceof Error ? error.message : 'Mission state submission failed. Please try again.'
      setToast({ message, tone: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0014]">
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded border border-red-500/40 bg-red-950/80 px-4 py-2 text-sm text-red-100 shadow-[0_0_20px_rgba(255,0,0,0.25)] backdrop-blur">
          {toast.message}
        </div>
      )}
      {/* Grid background */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,0,170,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,0,170,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      {/* Horizon glow */}
      <div className="fixed inset-x-0 bottom-0 h-[30vh] bg-gradient-to-t from-[#ff00aa]/30 via-[#9900ff]/10 to-transparent" />

      <div className="relative z-10 p-6 h-screen flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-[#ff00aa]/60 uppercase">
              Mission Control
            </div>
            <h1
              className="text-3xl font-bold text-white"
              style={{ fontFamily: 'system-ui', fontWeight: 800 }}
            >
              {scenario?.name ?? 'Active Mission'}
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-[#ff00aa]/40 text-[#ff00aa] hover:bg-[#ff00aa]/10 bg-transparent"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
          {/* Left Column - Status & Packages */}
          <div className="flex flex-col gap-4">
            {/* Status Card */}
            <div className="border border-[#ff00aa]/30 bg-[#ff00aa]/5 rounded-lg p-4 backdrop-blur-sm shadow-[0_0_20px_rgba(255,0,170,0.2)]">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-[#ff00aa]" />
                <span className="text-sm font-semibold text-white">Status</span>
              </div>
              <div className="text-2xl font-bold text-white mb-4">
                {isGenerated ? '✓ Ready' : '○ Pending'}
              </div>
              <div className="flex items-center gap-2">
                <Toggle
                  pressed={!!hotStart}
                  onPressedChange={(pressed) =>
                    activeStore.send({ type: 'setHotStart', hotStart: pressed })
                  }
                  className={cn(
                    'h-8 text-xs border border-[#ff00aa]/40',
                    hotStart && 'bg-[#ff00aa]/20 text-white'
                  )}
                >
                  Hot Start
                </Toggle>
                <button
                  onClick={isGenerated ? handleSubmitMissionState : handleGenerate}
                  disabled={isGenerating || isSubmitting}
                  className="flex-1 h-8 text-sm font-medium bg-[#ff00aa] text-white rounded hover:bg-[#ff00aa]/80 disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(255,0,170,0.5)]"
                >
                  {isGenerating
                    ? 'Generating...'
                    : isSubmitting
                      ? 'Submitting...'
                      : isGenerated
                        ? 'Submit Mission State'
                        : 'Generate'}
                </button>
              </div>
            </div>

            {/* Packages */}
            <div className="flex-1 border border-[#ff00aa]/30 bg-[#ff00aa]/5 rounded-lg p-4 backdrop-blur-sm min-h-0 flex flex-col">
              <div className="text-[10px] tracking-[0.2em] text-[#ff00aa]/60 uppercase mb-2">
                Packages
              </div>
              <div className="flex-1 overflow-auto space-y-2">
                {missionPackages.map((pkg) => {
                  const objective = objectivesByName.get(pkg.targetObjectiveId)
                  return (
                    <div
                      key={pkg.id}
                      className="border border-[#ff00aa]/20 rounded bg-[#ff00aa]/5 px-3 py-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-white">{pkg.type}</span>
                        <span className="text-xs text-[#00ddff] tabular-nums">
                          {formatTime(pkg.tot)}
                        </span>
                      </div>
                      <div className="text-[11px] text-white/50">
                        {objective?.name ?? pkg.targetObjectiveId}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Center Column - Flight Groups */}
          <div className="border border-[#ff00aa]/30 bg-[#ff00aa]/5 rounded-lg p-4 backdrop-blur-sm min-h-0 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Plane className="h-4 w-4 text-[#ff00aa]" />
              <span className="text-sm font-semibold text-white">Client Flights</span>
              <span className="text-xs text-white/40 ml-auto">{clientFlightGroups.length} groups</span>
            </div>
            <div className="flex-1 overflow-auto space-y-2">
              {clientFlightGroups.map((group) => {
                const clientCount = group.aircrafts.filter((ac) => ac.client).length
                return (
                  <div
                    key={group.id}
                    className="border border-[#9900ff]/30 rounded bg-[#9900ff]/10 px-3 py-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">{group.callsign}</span>
                      <span className="text-[10px] text-[#00ddff]">
                        {clientCount}/{group.aircrafts.length}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] text-white/50">
                      <span>{group.aircrafts[0]?.aircraftName}</span>
                      <span className="text-[#ff00aa]">{group.task}</span>
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">
                      Start {formatTime(group.flightplan.startTime)}{' '}
                      {group.tot && `• ToT ${formatTime(group.tot)}`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column - Time & Weather */}
          <div className="flex flex-col gap-4">
            {/* Time */}
            <div className="border border-[#00ddff]/30 bg-[#00ddff]/5 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-[#00ddff]" />
                <span className="text-sm font-semibold text-white">Mission Time</span>
              </div>
              <div className="text-4xl font-bold text-[#00ddff] tabular-nums">
                {campaignTime ? formatTime(campaignTime) : '--:--'}
              </div>
              <div className="flex justify-between mt-2 text-xs text-white/50">
                <span>UTC</span>
                <span className={timeMultiplier === 0 ? 'text-[#ff00aa]' : ''}>
                  x{timeMultiplier}
                </span>
              </div>
            </div>

            {/* Weather */}
            <div className="flex-1 border border-[#9900ff]/30 bg-[#9900ff]/5 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <CloudSun className="h-4 w-4 text-[#9900ff]" />
                <span className="text-sm font-semibold text-white">Weather</span>
              </div>
              {weather ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-xs text-white/50">
                      <Sun className="h-3 w-3" /> Temp
                    </span>
                    <span className="text-sm text-white">
                      {weather.temperature.mean.toFixed(0)}°C
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-xs text-white/50">
                      <Wind className="h-3 w-3" /> Wind
                    </span>
                    <span className="text-sm text-white">
                      {(weather.wind.speed * KNOTS_PER_MS).toFixed(0)} kt
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/50">Direction</span>
                    <span className="text-sm text-white">
                      {formatWindDirection(weather.wind.direction)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/50">Clouds</span>
                    <span className="text-sm text-white">
                      {Math.round(
                        (weather.cloudCover.baseCloudCover + weather.cloudCover.seasonEffect) * 100
                      )}
                      %
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-white/40">Loading...</div>
              )}
            </div>

            {/* Theatre Info */}
            <div className="border border-[#ff00aa]/20 rounded-lg p-3 bg-black/30">
              <div className="text-[10px] text-white/40 uppercase tracking-wider">Theatre</div>
              <div className="text-sm text-white">{scenario?.theatreName ?? '—'}</div>
              {scenario?.era && (
                <div className="text-[10px] text-[#ff00aa]/60 mt-1">{scenario.era}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
