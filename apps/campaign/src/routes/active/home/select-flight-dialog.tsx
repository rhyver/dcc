import { useState } from 'react'
import { Plane, ChevronLeft, User, PlaneTakeoff, RotateCcw, X } from 'lucide-react'
import { useSelector } from '@xstate/store/react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { activeStore } from '@/stores/active'
import { getAircraftDisplayName } from '@/lib/aircraft-display'
import { featureFlags } from '@/lib/feature-flags'

function formatTime(date: Date | string) {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }).format(d)
}

interface SelectFlightDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SelectFlightDialog({ open, onOpenChange }: SelectFlightDialogProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

  const flightGroups = useSelector(
    activeStore,
    (state) => state.context.coalitions.player.flightGroups
  )
  const campaignTime = useSelector(activeStore, (state) => state.context.time)
  const currentTime = campaignTime ? new Date(campaignTime) : new Date()

  // Group flight groups by task, only include tasks that have groups
  const groupsByTask = new Map<string, typeof flightGroups>()
  for (const group of flightGroups) {
    if (!featureFlags.transportFlightGroups && group.task === 'Transport') continue
    if (group.aircrafts.length === 0) continue

    const existing = groupsByTask.get(group.task)
    if (existing) {
      existing.push(group)
    } else {
      groupsByTask.set(group.task, [group])
    }
  }

  const tasks = Array.from(groupsByTask.keys()).sort()

  const handleClose = () => {
    onOpenChange(false)
    setSelectedTask(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          setSelectedTask(null)
        }
        onOpenChange(value)
      }}
    >
      <DialogContent
        className="border-synthwave-pink/30 bg-synthwave-dark/95 text-synthwave-light shadow-[0_0_30px_rgba(255,0,170,0.4)] backdrop-blur-xl sm:max-w-md"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            {selectedTask && (
              <button
                onClick={() => setSelectedTask(null)}
                className="text-secondary hover:text-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <Plane className="h-5 w-5 text-synthwave-pink" />
            <DialogTitle className="text-synthwave-cyan retro-font">
              {selectedTask ?? 'Select Task'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-secondary/70">
            {selectedTask
              ? 'Set the number of client slots per flight group'
              : 'Choose a mission type to see available flights'}
          </DialogDescription>
        </DialogHeader>

        {!selectedTask ? (
          // Task selection view
          <div className="grid grid-cols-2 gap-2">
            {tasks.map((task) => {
              const groups = groupsByTask.get(task)!
              const totalClients = groups.reduce(
                (sum, g) => sum + g.aircrafts.filter((a) => a.client).length,
                0
              )
              const airborneCount = groups.filter(
                (g) => new Date(g.flightplan.startTime) <= currentTime
              ).length
              return (
                <button
                  key={task}
                  onClick={() => setSelectedTask(task)}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-synthwave-pink/20 bg-synthwave-pink/5 p-3 text-center transition-colors hover:border-synthwave-pink/50 hover:bg-synthwave-pink/15"
                >
                  <span className="text-sm font-medium text-primary">{task}</span>
                  <div className="flex items-center gap-2 text-[10px] text-secondary/70">
                    <span>
                      {groups.length} {groups.length === 1 ? 'flight' : 'flights'}
                    </span>
                    {airborneCount > 0 && (
                      <span
                        className="flex items-center gap-0.5 text-amber-400"
                        title={`${airborneCount} already airborne`}
                      >
                        <PlaneTakeoff className="h-2.5 w-2.5" />
                        {airborneCount}
                      </span>
                    )}
                    {totalClients > 0 && (
                      <span className="flex items-center gap-0.5 text-synthwave-cyan">
                        <User className="h-2.5 w-2.5" />
                        {totalClients}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          // Flight groups for selected task
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {groupsByTask.get(selectedTask)!.map((group) => {
              const clientCount = group.aircrafts.filter((a) => a.client).length
              const isAirborne = new Date(group.flightplan.startTime) <= currentTime
              return (
                <div
                  key={group.id}
                  className={
                    isAirborne
                      ? 'rounded-lg border border-amber-400/40 bg-amber-400/5 p-3 space-y-2'
                      : 'rounded-lg border border-synthwave-pink/20 bg-synthwave-pink/5 p-3 space-y-2'
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{group.callsign}</span>
                        {isAirborne && (
                          <span className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                            <PlaneTakeoff className="h-2.5 w-2.5" />
                            Airborne
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-secondary/70 mt-0.5">
                        <span>
                          {group.aircrafts[0]
                            ? getAircraftDisplayName(group.aircrafts[0].aircraftName)
                            : 'Unknown'}
                        </span>
                        <span>{group.aircrafts.length} aircraft</span>
                        <span>{formatTime(group.flightplan.startTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary/70 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Clients
                    </span>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      size="sm"
                      value={clientCount.toString()}
                      onValueChange={(val) => {
                        if (!val) return
                        activeStore.send({
                          type: 'setFlightGroupClientCount',
                          flightGroupId: group.id,
                          count: parseInt(val)
                        })
                      }}
                    >
                      {Array.from({ length: group.aircrafts.length + 1 }).map((_, i) => (
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
                </div>
              )
            })}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="mr-auto border-synthwave-pink/30 text-secondary hover:bg-synthwave-pink/20 hover:text-white"
            onClick={() => {
              for (const fg of flightGroups) {
                if (fg.aircrafts.some((ac) => ac.client)) {
                  activeStore.send({
                    type: 'setFlightGroupClientCount',
                    flightGroupId: fg.id,
                    count: 0
                  })
                }
              }
            }}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
          {selectedTask && (
            <Button
              variant="outline"
              size="sm"
              className="border-synthwave-pink/30 text-secondary hover:bg-synthwave-pink/20 hover:text-white"
              onClick={() => setSelectedTask(null)}
            >
              <ChevronLeft className="mr-1.5 h-3.5 w-3.5" />
              Back
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-synthwave-pink/30 text-secondary hover:bg-synthwave-pink/20 hover:text-white"
            onClick={handleClose}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
