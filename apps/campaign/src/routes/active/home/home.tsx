import { Info, Sun, Target, Wind, FastForward, Pause, Play, Menu, Save, FileOutput, FolderOpen, Home as HomeIcon } from 'lucide-react'
import React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { useSelector } from '@xstate/store/react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollBar } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Map, type SelectedItem } from './map'
import { activeStore } from '@/stores/active'
import { coreClient } from '@/lib/orpc'
import { Clock } from './clock'
import { ActiveFlightGroups } from './active-flight-groups'
import { TakeoffButton } from './takeoff-button'

const campaignData = {
  description:
    'A daring raid on a heavily fortified enemy airbase. Intelligence suggests they are preparing a large-scale offensive. Your mission: cripple their air power before they can launch.',
  windSpeed: '15 knots',
  windDirection: 'NW',
  temperature: '28°C',
  objectives: ['Destroy the primary fuel depot', 'Disable the runway', 'Eliminate enemy air patrol']
}

const LOG_ROW_HEIGHT = 52
const LOG_OVERSCAN = 6

export function Home() {
  const [mapZoom, setMapZoom] = React.useState(7)
  const [isBriefingOpen, setIsBriefingOpen] = React.useState(false)
  const [isLogOpen, setIsLogOpen] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<SelectedItem>(null)
  const timeMultiplier = useSelector(activeStore, (state) => state.context.timeMultiplier)
  const logEntries = useSelector(activeStore, (state) => state.context.logs)
  const timerState = timeMultiplier === 0 ? 'pause' : timeMultiplier === 1 ? 'play' : 'fast-forward'
  const visibleLogs = React.useMemo(() => [...logEntries].reverse(), [logEntries])
  const logViewportRef = React.useRef<HTMLDivElement | null>(null)
  const [logScrollTop, setLogScrollTop] = React.useState(0)
  const [logViewportHeight, setLogViewportHeight] = React.useState(190)

  React.useEffect(() => {
    const viewport = logViewportRef.current
    if (!viewport) return

    const updateHeight = () => setLogViewportHeight(viewport.clientHeight)
    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [isLogOpen])

  const totalLogHeight = visibleLogs.length * LOG_ROW_HEIGHT
  const startIndex = Math.max(0, Math.floor(logScrollTop / LOG_ROW_HEIGHT) - LOG_OVERSCAN)
  const endIndex = Math.min(
    visibleLogs.length,
    Math.ceil((logScrollTop + logViewportHeight) / LOG_ROW_HEIGHT) + LOG_OVERSCAN
  )
  const virtualLogs = visibleLogs.slice(startIndex, endIndex)
  const handleLogItemClick = React.useCallback((entry: (typeof logEntries)[number]) => {
    if (!entry.entityType || !entry.entityId) return

    const snapshot = activeStore.getSnapshot().context
    if (entry.entityType === 'flightGroup') {
      const flightGroup =
        snapshot.coalitions.player.flightGroups.find((group) => group.id === entry.entityId) ??
        snapshot.coalitions.opponent.flightGroups.find((group) => group.id === entry.entityId)
      if (flightGroup) {
        setSelectedItem(flightGroup)
      }
      return
    }

    const groundGroup =
      snapshot.coalitions.player.groundGroups.find((group) => group.id === entry.entityId) ??
      snapshot.coalitions.opponent.groundGroups.find((group) => group.id === entry.entityId)
    if (groundGroup) {
      setSelectedItem(groundGroup)
    }
  }, [])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Map - Full screen background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 flex flex-col overflow-hidden">
          {/* Map Controls & Weather - Floating bottom right */}
          <div className="absolute bottom-8 right-4 z-1100 flex flex-col items-end gap-3">
            {/* Zoom Controls */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 border-synthwave-pink/30 bg-synthwave-dark/80 p-0 text-secondary backdrop-blur-md hover:bg-synthwave-pink/20"
                onClick={() => setMapZoom(Math.min(12, mapZoom + 1))}
              >
                +
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 border-synthwave-pink/30 bg-synthwave-dark/80 p-0 text-secondary backdrop-blur-md hover:bg-synthwave-pink/20"
                onClick={() => setMapZoom(Math.max(3, mapZoom - 1))}
              >
                -
              </Button>
            </div>

            {/* Weather Widget */}
            <Card className="pointer-events-auto border-synthwave-pink/30 bg-synthwave-dark/80 text-synthwave-light shadow-[0_0_15px_rgba(255,0,170,0.3)] backdrop-blur-md p-2">
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <Wind className="h-3.5 w-3.5 text-synthwave-pink" />
                  <span>
                    {campaignData.windSpeed} {campaignData.windDirection}
                  </span>
                </div>
                <div className="h-3 w-px bg-synthwave-pink/30" />
                <div className="flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-synthwave-pink" />
                  <span>{campaignData.temperature}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Synthwave grid background */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage:
                'linear-gradient(to right, var(--synthwave-pink) 1px, transparent 1px), linear-gradient(to bottom, var(--synthwave-pink) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              opacity: 0.3,
              perspective: '1000px',
              perspectiveOrigin: 'center',
              transform: 'rotateX(60deg)',
              backgroundPosition: 'center'
            }}
          />

          {/* Horizon glow */}
          <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-linear-to-t from-synthwave-pink via-synthwave-purple to-transparent opacity-30" />

          <Map selectedItem={selectedItem} onSelect={setSelectedItem} zoom={mapZoom} />
        </div>
      </div>

      {/* Sidebar - Floating Left Panel */}
      <div className="absolute top-4 left-4 bottom-4 w-[380px] z-10 flex flex-col gap-3 pointer-events-none overflow-hidden">
        {/* Controls - Now at the top */}
        <Card className="pointer-events-auto border-synthwave-pink/30 bg-synthwave-dark/80 text-synthwave-light shadow-[0_0_15px_rgba(255,0,170,0.3)] backdrop-blur-md p-3">
          <div className="flex flex-col gap-2">
            <div className="relative flex items-center justify-center border-b border-synthwave-pink/10 pb-2">
              <div className="absolute left-0">
                <CampaignMenu />
              </div>
              <Clock />
            </div>
            <div className="flex items-center justify-between gap-2">
              <ToggleGroup
                type="single"
                value={timerState}
                onValueChange={(value) => {
                  if (!value) return
                  switch (value) {
                    case 'pause':
                      activeStore.trigger.updateTimeMultiplier({ timeMultiplier: 0 })
                      break
                    case 'play':
                      activeStore.trigger.updateTimeMultiplier({ timeMultiplier: 1 })
                      break
                    case 'fast-forward':
                      activeStore.trigger.updateTimeMultiplier({ timeMultiplier: 300 })
                      break
                  }
                }}
              >
                <ToggleGroupItem
                  value="pause"
                  size="sm"
                  className="h-8 w-8 border border-synthwave-pink/20 data-[state=on]:bg-synthwave-pink/20 data-[state=on]:text-synthwave-pink hover:bg-synthwave-pink/10"
                >
                  <Pause className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="play"
                  size="sm"
                  className="h-8 w-8 border border-synthwave-pink/20 data-[state=on]:bg-synthwave-pink/20 data-[state=on]:text-synthwave-pink hover:bg-synthwave-pink/10"
                >
                  <Play className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="fast-forward"
                  size="sm"
                  className="h-8 w-8 border border-synthwave-pink/20 data-[state=on]:bg-synthwave-pink/20 data-[state=on]:text-synthwave-pink hover:bg-synthwave-pink/10"
                >
                  <FastForward className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              <TakeoffButton />
            </div>

            {/* Briefing Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-secondary hover:text-white hover:bg-synthwave-pink/10"
              onClick={() => setIsBriefingOpen(!isBriefingOpen)}
            >
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-synthwave-pink" />
                <span className="retro-font text-xs">Mission Briefing</span>
              </div>
              <span className="text-[10px]">{isBriefingOpen ? 'v' : '>'}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-secondary hover:text-white hover:bg-synthwave-pink/10"
              onClick={() => setIsLogOpen(!isLogOpen)}
            >
              <span className="retro-font text-xs">Action Log</span>
              <span className="text-[10px]">
                {isLogOpen ? 'v' : '>'} {logEntries.length}
              </span>
            </Button>

            {/* Briefing Content */}
            {isBriefingOpen && (
              <div className="border-t border-synthwave-pink/10 pt-2 space-y-4 max-h-[400px] overflow-y-auto pr-1">
                <div className="space-y-1 text-sm text-secondary/80">
                  {campaignData.description}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="retro-font text-xs font-medium uppercase text-primary">
                      Primary Objectives
                    </h4>
                    <span className="text-xs text-secondary">
                      {campaignData.objectives.length} Targets
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {campaignData.objectives.map((objective, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 p-2 rounded bg-synthwave-pink/5 border border-synthwave-pink/10"
                      >
                        <Target className="h-4 w-4 mt-0.5 text-synthwave-pink shrink-0" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Active Flight Groups */}
        <ActiveFlightGroups selectedItem={selectedItem} onSelect={setSelectedItem} />

        {isLogOpen && (
          <Card className="pointer-events-auto border-synthwave-pink/30 bg-synthwave-dark/80 text-synthwave-light shadow-[0_0_15px_rgba(255,0,170,0.3)] backdrop-blur-md p-2 h-[240px]">
            <div className="mb-2 flex items-center justify-between">
              <span className="retro-font text-xs uppercase text-primary">Action Log</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-secondary hover:text-white hover:bg-synthwave-pink/10"
                onClick={() => activeStore.send({ type: 'clearLogs' })}
              >
                Clear
              </Button>
            </div>
            <ScrollAreaPrimitive.Root className="relative h-[190px] overflow-hidden text-xs">
              <ScrollAreaPrimitive.Viewport
                ref={logViewportRef}
                className="focus-visible:ring-ring/50 size-full rounded-[inherit] pr-2 transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
                onScroll={(event) => setLogScrollTop(event.currentTarget.scrollTop)}
              >
                {visibleLogs.length === 0 ? (
                  <div className="text-secondary/70">No actions logged yet.</div>
                ) : (
                  <div style={{ height: totalLogHeight, position: 'relative' }}>
                    {virtualLogs.map((entry, idx) => {
                      const index = startIndex + idx
                      return (
                        <div
                          key={entry.id}
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: index * LOG_ROW_HEIGHT
                          }}
                          className="pb-0"
                        >
                          <div
                            className={`rounded border px-2 py-1 ${
                              entry.coalition === 'player'
                                ? 'border-cyan-400/30 bg-cyan-950/25'
                                : 'border-red-400/30 bg-red-950/25'
                            } ${
                              entry.entityId
                                ? 'cursor-pointer hover:ring-1 hover:ring-synthwave-pink/40'
                                : ''
                            }`}
                            onClick={() => handleLogItemClick(entry)}
                            role={entry.entityId ? 'button' : undefined}
                            tabIndex={entry.entityId ? 0 : undefined}
                            onKeyDown={(event) => {
                              if (!entry.entityId) return
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                handleLogItemClick(entry)
                              }
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`uppercase tracking-wide ${
                                    entry.type === 'combat' ? 'text-red-300' : 'text-cyan-300'
                                  }`}
                                >
                                  {entry.type}
                                </span>
                                {entry.label && (
                                  <span className="text-[10px] text-secondary uppercase tracking-wide">
                                    {entry.label}
                                  </span>
                                )}
                              </div>
                              <span className="text-secondary/70">
                                {new Date(entry.campaignTime).toLocaleTimeString()}
                              </span>
                            </div>
                            <div
                              className={
                                entry.coalition === 'player'
                                  ? 'mt-0.5 text-cyan-100'
                                  : 'mt-0.5 text-red-100'
                              }
                            >
                              {entry.message}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollAreaPrimitive.Viewport>
              <ScrollBar />
              <ScrollAreaPrimitive.Corner />
            </ScrollAreaPrimitive.Root>
          </Card>
        )}
      </div>
    </div>
  )
}

function CampaignMenu() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()

  const handleSave = async () => {
    const snapshot = activeStore.getSnapshot().context
    await coreClient.campaign.saveActiveCampaign({
      ...snapshot,
      timeMultiplier: 0
    })
    setOpen(false)
  }

  const handleExportMission = async () => {
    await coreClient.campaign.generateMiz(activeStore.getSnapshot().context)
    setOpen(false)
  }

  const handleReturnToStart = () => {
    setOpen(false)
    navigate('/new')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-secondary hover:text-white hover:bg-synthwave-pink/10"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="border-synthwave-pink/30 bg-synthwave-dark/95 text-synthwave-light shadow-[0_0_30px_rgba(255,0,170,0.3)] backdrop-blur-md sm:max-w-sm"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="retro-font text-sm uppercase text-primary">
            Campaign Menu
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-secondary hover:text-white hover:bg-synthwave-pink/10"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 text-synthwave-pink" />
            Save Campaign
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-secondary hover:text-white hover:bg-synthwave-pink/10"
            onClick={handleExportMission}
          >
            <FileOutput className="h-4 w-4 text-synthwave-pink" />
            Export Mission
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-secondary hover:text-white hover:bg-synthwave-pink/10"
            onClick={() => { setOpen(false); navigate('/load') }}
          >
            <FolderOpen className="h-4 w-4 text-synthwave-pink" />
            Open Campaign
          </Button>
          <div className="h-px bg-synthwave-pink/20" />
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-secondary hover:text-white hover:bg-synthwave-pink/10"
            onClick={handleReturnToStart}
          >
            <HomeIcon className="h-4 w-4 text-synthwave-pink" />
            Return to Start
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
