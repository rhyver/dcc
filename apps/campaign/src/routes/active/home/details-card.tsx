import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction
} from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { X, User } from 'lucide-react'
import { activeStore } from '@/stores/active'
import { type SelectedItem } from './map'

export function DetailsCard({
  selectedItem,
  onClose
}: {
  selectedItem: SelectedItem
  onClose: () => void
}) {
  if (!selectedItem) return null

  return (
    <div className="absolute top-4 right-4 w-80 z-[1100]">
      <Card className="backdrop-blur-md bg-synthwave-dark/80 border-synthwave-pink/30 text-synthwave-light shadow-[0_0_15px_rgba(255,0,170,0.3)]">
        <CardHeader>
          <CardTitle className="text-synthwave-cyan retro-font">
            {'callsign' in selectedItem ? selectedItem.callsign : selectedItem.name}
          </CardTitle>
          <CardDescription className="capitalize text-secondary">
            {'coalition' in selectedItem ? selectedItem.coalition : 'player'}{' '}
            {'type' in selectedItem
              ? String(selectedItem.type)
              : 'callsign' in selectedItem
                ? 'Flight Group'
                : 'Objective'}
          </CardDescription>
          <CardAction>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-synthwave-pink hover:bg-synthwave-pink/20 hover:text-synthwave-pink"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {'lat' in selectedItem.position && (
              <>
                <div className="text-secondary/70">Latitude</div>
                <div>{(selectedItem.position as { lat: number }).lat.toFixed(4)}</div>
                <div className="text-secondary/70">Longitude</div>
                <div>{(selectedItem.position as { lng: number }).lng.toFixed(4)}</div>
              </>
            )}
            {'structureType' in selectedItem && (
              <>
                <div className="text-secondary/70">Structure Type</div>
                <div>{String(selectedItem.structureType)}</div>
              </>
            )}
            {'flightplan' in selectedItem && (
              <>
                <div className="text-secondary/70">Task</div>
                <div>{(selectedItem as { task: string }).task}</div>
                <div className="text-secondary/70">Waypoints</div>
                <div>{selectedItem.flightplan.waypoints.length}</div>
                {'aircrafts' in selectedItem && (
                  <>
                    <div className="text-secondary/70 flex items-center gap-2">
                      Clients
                      <User className="h-3 w-3" />
                    </div>
                    <div>
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        size="sm"
                        value={selectedItem.aircrafts.filter((a) => a.client).length.toString()}
                        onValueChange={(val) => {
                          if (!val) return
                          activeStore.send({
                            type: 'setFlightGroupClientCount',
                            flightGroupId: selectedItem.id,
                            count: parseInt(val)
                          })
                        }}
                      >
                        {Array.from({ length: selectedItem.aircrafts.length + 1 }).map((_, i) => (
                          <ToggleGroupItem
                            key={i}
                            value={i.toString()}
                            className="h-6 w-6 p-0 text-xs"
                          >
                            {i}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                  </>
                )}
              </>
            )}
            {'range' in selectedItem && typeof selectedItem.range === 'number' && (
              <>
                <div className="text-secondary/70">Range</div>
                <div>{(selectedItem.range / 1000).toFixed(1)} km</div>
                <div className="text-secondary/70">Status</div>
                <div
                  className={
                    (selectedItem as unknown as { active: boolean }).active
                      ? 'text-green-400'
                      : 'text-red-400'
                  }
                >
                  {(selectedItem as unknown as { active: boolean }).active ? 'Active' : 'Inactive'}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
