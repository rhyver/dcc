import { useSelector } from '@xstate/store/react'
import { FastForward, Pause, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { activeStore } from '@/stores/active'
import { Clock } from './clock'
import { coreClient } from '@/lib/orpc'

export function Header() {
  const name = useSelector(activeStore, (state) => state.context.name)
  const timeMultiplier = useSelector(activeStore, (state) => state.context.timeMultiplier)
  const timerState = timeMultiplier === 0 ? 'pause' : timeMultiplier === 1 ? 'play' : 'fast-forward'

  return (
    <div className="border-b border-[#ff00aa]/30 bg-[#0b0014]/90 px-4 py-2 flex">
      <div className="flex items-center justify-between flex-1">
        <h1 className="retro-font text-xl font-medium text-[#00ddff]">
          <span className="text-[#ff00aa]">OPERATION:</span> {name}
        </h1>
        <div className="flex items-center gap-4">
          <Clock />
          <ToggleGroup
            type="single"
            className="text-white"
            value={timerState}
            onValueChange={(value) => {
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
              variant="outline"
              className="h-8 w-8 border-[#ff00aa]/50 bg-[#0b0014]/80 text-[#ff00aa] hover:bg-[#ff00aa]/20"
            >
              <Pause className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="play"
              variant="outline"
              className="h-8 w-8 border-[#ff00aa]/50 bg-[#0b0014]/80 text-[#ff00aa] hover:bg-[#ff00aa]/20"
            >
              <Play className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="fast-forward"
              variant="outline"
              className="h-8 w-8 border-[#ff00aa]/50 bg-[#0b0014]/80 text-[#ff00aa] hover:bg-[#ff00aa]/20"
            >
              <FastForward className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-[#ff00aa]/50 bg-[#0b0014]/80 px-3 text-xs text-[#ff00aa] hover:bg-[#ff00aa]/20"
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
            variant="outline"
            size="sm"
            className="h-8 border-[#ff00aa]/50 bg-[#0b0014]/80 px-3 text-xs text-[#ff00aa] hover:bg-[#ff00aa]/20"
            onClick={() => coreClient.campaign.generateMiz(activeStore.getSnapshot().context)}
          >
            Takeoff
          </Button>
        </div>
      </div>
    </div>
  )
}
