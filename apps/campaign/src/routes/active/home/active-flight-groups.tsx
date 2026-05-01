import { Plane } from 'lucide-react'
import { useSelector } from '@xstate/store/react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { activeStore } from '@/stores/active'
import { FlightGroupCard } from '../components/flight-group-card'
import type { SelectedItem } from './map'

interface ActiveFlightGroupsProps {
  selectedItem: SelectedItem
  onSelect: (item: SelectedItem) => void
}

export function ActiveFlightGroups({ selectedItem, onSelect }: ActiveFlightGroupsProps) {
  const flightGroups = useSelector(
    activeStore,
    (state) => state.context.coalitions.player.flightGroups
  )
  const campaignTime = useSelector(activeStore, (state) => state.context.time)
  const currentTime = campaignTime ? new Date(campaignTime) : new Date()

  return (
    <Card className="pointer-events-auto flex-1 overflow-hidden border-synthwave-pink/30 bg-synthwave-dark/80 text-synthwave-light shadow-[0_0_15px_rgba(255,0,170,0.3)] backdrop-blur-md flex flex-col min-h-0 gap-0 py-0">
      <CardHeader className="py-2 border-b border-synthwave-pink/10">
        <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
          <Plane className="h-4 w-4 text-synthwave-pink" />
          <span className="retro-font">Flight Groups</span>
        </CardTitle>
      </CardHeader>
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <CardContent>
          {flightGroups.length === 0 ? (
            <div className="text-sm text-secondary/60 text-center italic">No active flights</div>
          ) : (
            <div className="space-y-2">
              {flightGroups.map((group) => (
                <FlightGroupCard
                  key={group.id}
                  group={group}
                  isAirborne={new Date(group.flightplan.startTime) <= currentTime}
                  selected={selectedItem?.id === group.id}
                  onClick={() => onSelect(selectedItem?.id === group.id ? null : group)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  )
}
