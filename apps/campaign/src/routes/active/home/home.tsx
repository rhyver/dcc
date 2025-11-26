import { Info, Sun, Target, Wind, FastForward, Pause, Play } from 'lucide-react'
import React from 'react'
import { useSelector } from '@xstate/store/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Map } from './map'
import { activeStore } from '@/stores/active'
import { Clock } from './clock'
import { coreClient } from '@/lib/orpc'

const campaignData = {
  description:
    'A daring raid on a heavily fortified enemy airbase. Intelligence suggests they are preparing a large-scale offensive. Your mission: cripple their air power before they can launch.',
  windSpeed: '15 knots',
  windDirection: 'NW',
  temperature: '28°C',
  objectives: ['Destroy the primary fuel depot', 'Disable the runway', 'Eliminate enemy air patrol']
}

export function Home() {
  const [mapZoom, setMapZoom] = React.useState(1)
  const timeMultiplier = useSelector(activeStore, (state) => state.context.timeMultiplier)
  const timerState = timeMultiplier === 0 ? 'pause' : timeMultiplier === 1 ? 'play' : 'fast-forward'

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Map - Full screen background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 flex flex-col overflow-hidden">
          {/* Map Controls & Weather - Floating bottom right */}
          <div className="absolute bottom-8 right-4 z-20 flex flex-col items-end gap-3">
            {/* Zoom Controls */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 border-[#ff00aa]/30 bg-[#0b0014]/80 p-0 text-secondary backdrop-blur-md hover:bg-[#ff00aa]/20"
                onClick={() => setMapZoom(Math.min(2, mapZoom + 0.5))}
              >
                +
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 border-[#ff00aa]/30 bg-[#0b0014]/80 p-0 text-secondary backdrop-blur-md hover:bg-[#ff00aa]/20"
                onClick={() => setMapZoom(Math.max(0.5, mapZoom - 0.5))}
              >
                -
              </Button>
            </div>

            {/* Weather Widget */}
            <Card className="pointer-events-auto border-[#ff00aa]/30 bg-[#0b0014]/80 text-[#e0e0ff] shadow-[0_0_15px_rgba(255,0,170,0.3)] backdrop-blur-md p-2">
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <Wind className="h-3.5 w-3.5 text-[#ff00aa]" />
                  <span>
                    {campaignData.windSpeed} {campaignData.windDirection}
                  </span>
                </div>
                <div className="h-3 w-px bg-[#ff00aa]/30" />
                <div className="flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-[#ff00aa]" />
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
                'linear-gradient(to right, rgba(255, 0, 170, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 0, 170, 0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              perspective: '1000px',
              perspectiveOrigin: 'center',
              transform: 'rotateX(60deg)',
              backgroundPosition: 'center'
            }}
          />

          {/* Horizon glow */}
          <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-linear-to-t from-[#ff00aa] via-[#9900ff] to-transparent opacity-30" />

          <Map />
        </div>
      </div>

      {/* Sidebar - Floating Left Panel */}
      <div className="absolute top-4 left-4 bottom-4 w-[380px] z-10 flex flex-col gap-3 pointer-events-none">
        {/* Controls - Now at the top */}
        <Card className="pointer-events-auto border-[#ff00aa]/30 bg-[#0b0014]/80 text-[#e0e0ff] shadow-[0_0_15px_rgba(255,0,170,0.3)] backdrop-blur-md p-3">
          <div className="flex flex-col gap-2">
            <div className="flex justify-center border-b border-[#ff00aa]/10 pb-2">
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
                  className="h-8 w-8 border border-[#ff00aa]/20 data-[state=on]:bg-[#ff00aa]/20 data-[state=on]:text-[#ff00aa] hover:bg-[#ff00aa]/10"
                >
                  <Pause className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="play"
                  size="sm"
                  className="h-8 w-8 border border-[#ff00aa]/20 data-[state=on]:bg-[#ff00aa]/20 data-[state=on]:text-[#ff00aa] hover:bg-[#ff00aa]/10"
                >
                  <Play className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="fast-forward"
                  size="sm"
                  className="h-8 w-8 border border-[#ff00aa]/20 data-[state=on]:bg-[#ff00aa]/20 data-[state=on]:text-[#ff00aa] hover:bg-[#ff00aa]/10"
                >
                  <FastForward className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-[#ff00aa]/50 bg-transparent hover:bg-[#ff00aa]/10 text-[#ff00aa]"
                  onClick={() =>
                    coreClient.campaign.saveActiveCampaign({
                      ...activeStore.getSnapshot().context,
                      timeMultiplier: 0
                    })
                  }
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-[#ff00aa] hover:bg-[#ff00aa]/80 text-white border-none shadow-[0_0_10px_rgba(255,0,170,0.5)]"
                  onClick={() => coreClient.campaign.generateMiz(activeStore.getSnapshot().context)}
                >
                  Takeoff
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Content Area */}
        <Card className="pointer-events-auto flex-1 overflow-hidden border-[#ff00aa]/30 bg-[#0b0014]/80 text-[#e0e0ff] shadow-[0_0_15px_rgba(255,0,170,0.3)] backdrop-blur-md flex flex-col">
          <CardHeader className="pb-2 border-b border-[#ff00aa]/10">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
              <Info className="h-4 w-4 text-[#ff00aa]" />
              <span className="retro-font">Campaign Briefing</span>
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="pt-4">
              <div className="space-y-1 text-sm text-secondary/80">{campaignData.description}</div>

              <div className="mt-6">
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
                      className="flex items-start gap-2 p-2 rounded bg-[#ff00aa]/5 border border-[#ff00aa]/10"
                    >
                      <Target className="h-4 w-4 mt-0.5 text-[#ff00aa] shrink-0" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}
