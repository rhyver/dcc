import { Plane, Clock, Crosshair, User } from 'lucide-react'
import { useSelector } from '@xstate/store/react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { activeStore } from '@/stores/active'
import { cn, getAircraftDisplayName } from '@/lib/utils'
import { type SelectedItem } from './map'

interface ActiveFlightGroupsProps {
  selectedItem: SelectedItem
  onSelect: (item: SelectedItem) => void
}

function formatTime(date: Date | string) {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }).format(d)
}

export function ActiveFlightGroups({ selectedItem, onSelect }: ActiveFlightGroupsProps) {
  const flightGroups = useSelector(
    activeStore,
    (state) => state.context.coalitions.player.flightGroups
  )

  return (
    <Card className="pointer-events-auto flex-1 overflow-hidden border-synthwave-pink/30 bg-synthwave-dark/80 text-synthwave-light shadow-[0_0_15px_rgba(255,0,170,0.3)] backdrop-blur-md flex flex-col min-h-0">
      <CardHeader className="pb-2 border-b border-synthwave-pink/10">
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
              {flightGroups.map((group) => {
                return (
                  <div
                    key={group.id}
                    className={cn(
                      'flex items-center justify-between p-2 rounded cursor-pointer transition-colors',
                      selectedItem?.id === group.id
                        ? 'bg-synthwave-pink/20 border border-synthwave-pink'
                        : 'bg-synthwave-pink/5 border border-synthwave-pink/10 hover:bg-synthwave-pink/10'
                    )}
                    onClick={() => onSelect(selectedItem?.id === group.id ? null : group)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{group.callsign}</span>
                        <span className="text-xs text-secondary/80 px-1.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/20">
                          {group.task}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-secondary/70 mt-1">
                        <div className="flex items-center gap-1" title="Start Time">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(group.flightplan.startTime)}</span>
                        </div>
                        {group.tot && (
                          <div className="flex items-center gap-1" title="Time Over Target">
                            <Crosshair className="h-3 w-3" />
                            <span>{formatTime(group.tot)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs font-medium text-secondary">
                        {group.aircrafts[0] ? getAircraftDisplayName(group.aircrafts[0].aircraftName) : 'Unknown'}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-secondary/60">
                        <span>{group.aircrafts.length} Aircraft</span>
                        <div className="flex items-center gap-1" title="Client slots">
                          <User className="h-3 w-3" />
                          <span>{group.aircrafts.filter((a) => a.client).length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  )
}
