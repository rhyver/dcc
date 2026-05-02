import { useMemo } from 'react'
import { Plane } from 'lucide-react'
import { useSelector } from '@xstate/store/react'

import { CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { activeStore } from '@/stores/active'
import { hasFlightGroupTakenOff } from '@/logic/entities/flight-status'
import { FlightGroupCard } from '../components/flight-group-card'
import type { SelectedItem } from './map'

interface ActiveFlightGroupsProps {
  selectedItem: SelectedItem
  onSelect: (item: SelectedItem) => void
  onPreview: (item: SelectedItem) => void
}

export function ActiveFlightGroups({ selectedItem, onSelect, onPreview }: ActiveFlightGroupsProps) {
  const flightGroups = useSelector(
    activeStore,
    (state) => state.context.coalitions.player.flightGroups
  )
  const campaignTime = useSelector(activeStore, (state) => state.context.time)
  const currentTime = campaignTime ? new Date(campaignTime) : new Date()
  const orderedFlightGroups = useMemo(
    () =>
      [...flightGroups].sort((a, b) => {
        const startA = new Date(a.flightplan.startTime).getTime()
        const startB = new Date(b.flightplan.startTime).getTime()

        if (startA !== startB) {
          return startA - startB
        }

        return a.callsign.localeCompare(b.callsign)
      }),
    [flightGroups]
  )

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      <div className="py-2 px-4 border-b border-synthwave-pink/20 shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Plane className="h-4 w-4 text-synthwave-pink" />
          <span className="retro-font">Flight Groups</span>
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <CardContent>
          {orderedFlightGroups.length === 0 ? (
            <div className="text-sm text-secondary/60 text-center italic">No active flights</div>
          ) : (
            <div className="space-y-2">
              {orderedFlightGroups.map((group) => (
                <FlightGroupCard
                  key={group.id}
                  group={group}
                  isAirborne={hasFlightGroupTakenOff(group, currentTime)}
                  selected={selectedItem?.id === group.id}
                  onClick={() => onSelect(selectedItem?.id === group.id ? null : group)}
                  onMouseEnter={() => onPreview(group)}
                  onMouseLeave={() => onPreview(null)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </div>
  )
}
