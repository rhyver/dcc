import { useMemo, useState } from 'react'
import { useSelector } from '@xstate/store/react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  CloudSun,
  Clock,
  Plane,
  Sun,
  Target,
  Wind
} from 'lucide-react'
import { useNavigate } from 'react-router'

import { activeStore } from '@/stores/active'
import { coreClient, orpc } from '@/lib/orpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
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

function formatDateTime(date: Date | string) {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  })
    .format(d)
    .replace(', ', ' ')
}

function formatWindDirection(degrees: number) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const
  const index = Math.round(degrees / 45) % directions.length
  return `${degrees.toFixed(0)}° ${directions[index]}`
}

export function Mission() {
  const navigate = useNavigate()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const scenarioId = useSelector(activeStore, (state) => state.context.scenarioId)
  const campaignTime = useSelector(activeStore, (state) => state.context.time)
  const timeMultiplier = useSelector(activeStore, (state) => state.context.timeMultiplier)
  const hotStart = useSelector(activeStore, (state) => state.context.campaignParams?.hotStart)
  const playerPackages = useSelector(activeStore, (state) => state.context.coalitions.player.packages)
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-synthwave-light">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--synthwave-pink) 1px, transparent 1px), linear-gradient(to bottom, var(--synthwave-pink) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.15
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-linear-to-t from-synthwave-pink/40 via-synthwave-purple/20 to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-synthwave-pink/80">
              Mission Control
            </div>
            <h1 className="retro-font text-2xl text-white">
              {scenario?.name ?? 'Active Mission'}
            </h1>
            {scenario?.era && (
              <div className="text-xs text-secondary/70">Era: {scenario.era}</div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-synthwave-pink/40 text-synthwave-pink hover:bg-synthwave-pink/10"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to map
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4">
            <Card className="border-synthwave-pink/30 bg-synthwave-dark/80 text-synthwave-light shadow-[0_0_15px_rgba(255,0,170,0.3)] backdrop-blur-md">
              <CardHeader className="border-b border-synthwave-pink/10">
                <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
                  <Target className="h-4 w-4 text-synthwave-pink" />
                  <span className="retro-font">
                    {isGenerated ? 'Mission generated' : 'Ready for Takeoff'}
                  </span>
                </CardTitle>
                <CardDescription className="text-secondary/70">
                  {isGenerated
                    ? 'You can now start the mission in DCS.'
                    : 'Generate the mission file before you start.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <Toggle
                  pressed={!!hotStart}
                  onPressedChange={(pressed) =>
                    activeStore.send({ type: 'setHotStart', hotStart: pressed })
                  }
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-8 border-synthwave-pink/40 text-synthwave-pink hover:bg-synthwave-pink/10',
                    hotStart && 'bg-synthwave-pink/20 text-white'
                  )}
                >
                  Hot Start
                </Toggle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-synthwave-pink/40 text-synthwave-pink hover:bg-synthwave-pink/10"
                    onClick={() => navigate('/')}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-synthwave-pink hover:bg-synthwave-pink/80 text-white border-none shadow-[0_0_10px_rgba(255,0,170,0.5)]"
                    onClick={async () => {
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
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Mission'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-synthwave-pink/30 bg-synthwave-dark/80 text-synthwave-light shadow-[0_0_15px_rgba(255,0,170,0.3)] backdrop-blur-md">
              <CardHeader className="border-b border-synthwave-pink/10">
                <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
                  <Target className="h-4 w-4 text-synthwave-pink" />
                  <span className="retro-font">Current Mission</span>
                </CardTitle>
                <CardDescription className="text-secondary/70">
                  {scenario?.theatreName ? `Theatre: ${scenario.theatreName}` : 'Theatre loading...'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scenario?.briefing && (
                  <div
                    className="text-sm text-secondary/80 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: scenario.briefing }}
                  />
                )}
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-synthwave-pink/70">
                    Packages
                  </div>
                  {missionPackages.length === 0 ? (
                    <div className="text-sm text-secondary/60 italic">No active packages.</div>
                  ) : (
                    <div className="space-y-2">
                      {missionPackages.map((pkg) => {
                        const objective = objectivesByName.get(pkg.targetObjectiveId)
                        const objectiveLabel = objective ? `${objective.name} (${objective.type})` : pkg.targetObjectiveId
                        return (
                          <div
                            key={pkg.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded border border-synthwave-pink/20 bg-synthwave-pink/5 px-3 py-2"
                          >
                            <div>
                              <div className="text-sm font-medium text-white">{pkg.type}</div>
                              <div className="text-xs text-secondary/70">Target: {objectiveLabel}</div>
                            </div>
                            <div className="text-xs text-secondary/70">
                              ToT {formatTime(pkg.tot)} UTC
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-synthwave-pink/30 bg-synthwave-dark/80 text-synthwave-light shadow-[0_0_15px_rgba(255,0,170,0.3)] backdrop-blur-md flex min-h-0 flex-1 flex-col">
              <CardHeader className="border-b border-synthwave-pink/10">
                <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
                  <Plane className="h-4 w-4 text-synthwave-pink" />
                  <span className="retro-font">Client Flight Groups</span>
                </CardTitle>
                <CardDescription className="text-secondary/70">
                  {clientFlightGroups.length} group{clientFlightGroups.length === 1 ? '' : 's'} ready
                </CardDescription>
              </CardHeader>
              <ScrollArea className="flex-1">
                <CardContent className="space-y-2">
                  {clientFlightGroups.length === 0 ? (
                    <div className="text-sm text-secondary/60 italic">
                      No flight groups have client slots assigned.
                    </div>
                  ) : (
                    clientFlightGroups.map((group) => {
                      const clientCount = group.aircrafts.filter((ac) => ac.client).length
                      return (
                        <div
                          key={group.id}
                          className="rounded border border-synthwave-pink/20 bg-synthwave-pink/5 px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium text-white">{group.callsign}</div>
                              <div className="text-xs text-secondary/70">Task: {group.task}</div>
                            </div>
                            <div className="text-xs text-secondary/70">
                              {clientCount}/{group.aircrafts.length} clients
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-secondary/70">
                            <div>Aircraft: {group.aircrafts[0]?.aircraftName ?? 'Unknown'}</div>
                            <div>Start {formatTime(group.flightplan.startTime)} UTC</div>
                            {group.tot && <div>ToT {formatTime(group.tot)} UTC</div>}
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </ScrollArea>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="border-synthwave-pink/30 bg-synthwave-dark/80 text-synthwave-light shadow-[0_0_15px_rgba(255,0,170,0.3)] backdrop-blur-md">
              <CardHeader className="border-b border-synthwave-pink/10">
                <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
                  <Clock className="h-4 w-4 text-synthwave-pink" />
                  <span className="retro-font">Mission Time</span>
                </CardTitle>
                <CardDescription className="text-secondary/70">
                  Current campaign clock
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-secondary/70">UTC</span>
                  <span className="font-medium text-white">
                    {campaignTime ? formatDateTime(campaignTime) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary/70">Time multiplier</span>
                  <span className={cn('font-medium', timeMultiplier === 0 ? 'text-synthwave-pink' : 'text-white')}>
                    x{timeMultiplier}
                  </span>
                </div>
                {scenario?.date && (
                  <div className="flex items-center justify-between">
                    <span className="text-secondary/70">Scenario start</span>
                    <span className="font-medium text-white">{formatDateTime(scenario.date)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-synthwave-pink/30 bg-synthwave-dark/80 text-synthwave-light shadow-[0_0_15px_rgba(255,0,170,0.3)] backdrop-blur-md">
              <CardHeader className="border-b border-synthwave-pink/10">
                <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
                  <CloudSun className="h-4 w-4 text-synthwave-pink" />
                  <span className="retro-font">Weather</span>
                </CardTitle>
                <CardDescription className="text-secondary/70">
                  {scenario?.theatreName ?? 'Theatre weather'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-secondary/70">
                    <Sun className="h-4 w-4" />
                    Temperature
                  </span>
                  <span className="font-medium text-white">
                    {weather
                      ? `${weather.temperature.mean.toFixed(0)}°C ± ${weather.temperature.amplitude.toFixed(0)}°`
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-secondary/70">
                    <Wind className="h-4 w-4" />
                    Wind
                  </span>
                  <span className="font-medium text-white">
                    {weather
                      ? `${formatWindDirection(weather.wind.direction)} · ${weather.wind.speed.toFixed(1)} m/s (${(weather.wind.speed * KNOTS_PER_MS).toFixed(1)} kt)`
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary/70">Cloud cover</span>
                  <span className="font-medium text-white">
                    {weather
                      ? `${Math.round(
                          (weather.cloudCover.baseCloudCover + weather.cloudCover.seasonEffect) * 100
                        )}%`
                      : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
