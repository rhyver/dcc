import { useMemo, useState } from 'react'
import { Grid2X2, List, Plane, PlaneTakeoff, Plus, RotateCcw, User, X } from 'lucide-react'
import { useSelector } from '@xstate/store/react'

import { CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { activeStore } from '@/stores/active'
import { hasFlightGroupTakenOff } from '@/logic/entities/flight-status'
import { canCreateManualFlightGroup } from '@/logic/systems/spawn/manual-flight-group'
import { FlightGroupCard } from '../components/flight-group-card'
import type { SelectedItem } from './map'
import { getFlightGroupsByTask, getSortedFlightGroupTasks } from './flight-group-task-groups'

const MANUAL_FLIGHT_TASKS = ['CAP', 'CAS', 'DEAD', 'Pinpoint Strike', 'SEAD'] as const

interface ActiveFlightGroupsProps {
  selectedItem: SelectedItem
  onSelect: (item: SelectedItem) => void
  onPreview: (item: SelectedItem) => void
}

export function ActiveFlightGroups({ selectedItem, onSelect, onPreview }: ActiveFlightGroupsProps) {
  const [viewMode, setViewMode] = useState<'tasks' | 'all'>('tasks')
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const flightGroups = useSelector(
    activeStore,
    (state) => state.context.coalitions.player.flightGroups
  )
  const campaign = useSelector(activeStore, (state) => state.context)
  const creatableTasks = useMemo(
    () =>
      new Set(
        MANUAL_FLIGHT_TASKS.filter((task) => canCreateManualFlightGroup(campaign, 'player', task))
      ),
    [campaign]
  )
  const campaignTime = useSelector(activeStore, (state) => state.context.time)
  const currentTime = campaignTime ? new Date(campaignTime) : new Date()
  const taskGroups = useMemo(() => {
    const orderedFlightGroups = [...flightGroups].sort((a, b) => {
      const startA = new Date(a.flightplan.startTime).getTime()
      const startB = new Date(b.flightplan.startTime).getTime()

      if (startA !== startB) {
        return startA - startB
      }

      return a.callsign.localeCompare(b.callsign)
    })
    const groupsByTask = getFlightGroupsByTask(orderedFlightGroups)

    return getSortedFlightGroupTasks(groupsByTask).map((task) => ({
      task,
      groups: groupsByTask.get(task) ?? []
    }))
  }, [flightGroups])
  const selectedTaskGroups = taskGroups.find(({ task }) => task === selectedTask)?.groups ?? []
  const orderedFlightGroups = taskGroups.flatMap(({ groups }) => groups)
  const visibleFlightGroups = selectedTask ? selectedTaskGroups : orderedFlightGroups
  const hasSelectedClients = orderedFlightGroups.some((group) =>
    group.aircrafts.some((aircraft) => aircraft.client)
  )

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      <div className="px-5 pb-8 pt-6 shrink-0">
        <div className="flex items-center gap-3 text-lg font-semibold text-white">
          <Plane className="h-5 w-5 text-synthwave-pink" />
          <span className="retro-font">Flight Groups</span>
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <CardContent>
          <div className="space-y-3">
            <div className="relative flex min-h-8 items-center justify-center">
              <ToggleGroup
                type="single"
                size="sm"
                value={viewMode}
                onValueChange={(value) => {
                  if (value === 'tasks') {
                    setViewMode(value)
                    setSelectedTask(null)
                  } else if (value === 'all') {
                    setViewMode(value)
                    setSelectedTask(null)
                  }
                }}
                className="grid w-24 grid-cols-2 rounded-lg border border-synthwave-pink/20 bg-synthwave-pink/5 p-0.5"
              >
                <ToggleGroupItem
                  value="tasks"
                  className="h-7 border-0 bg-transparent p-0 text-secondary shadow-none hover:bg-synthwave-pink/10 hover:text-white data-[state=on]:bg-synthwave-pink/20 data-[state=on]:text-synthwave-pink data-[state=on]:shadow-none"
                  title="Task view"
                  aria-label="Task view"
                >
                  <Grid2X2 className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="all"
                  className="h-7 border-0 bg-transparent p-0 text-secondary shadow-none hover:bg-synthwave-pink/10 hover:text-white data-[state=on]:bg-synthwave-pink/20 data-[state=on]:text-synthwave-pink data-[state=on]:shadow-none"
                  title="All flights"
                  aria-label="All flights"
                >
                  <List className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </ToggleGroup>
              <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2">
                {hasSelectedClients && (
                  <button
                    onClick={() => {
                      for (const group of orderedFlightGroups) {
                        if (group.aircrafts.some((aircraft) => aircraft.client)) {
                          activeStore.send({
                            type: 'setFlightGroupClientCount',
                            flightGroupId: group.id,
                            count: 0
                          })
                        }
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-synthwave-pink/20 bg-synthwave-pink/5 text-secondary transition-colors hover:bg-synthwave-pink/10 hover:text-white"
                    title="Reset client slots"
                    aria-label="Reset client slots"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsNewDialogOpen(true)}
                  disabled={creatableTasks.size === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-synthwave-pink/20 bg-synthwave-pink/5 text-secondary transition-colors hover:bg-synthwave-pink/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-synthwave-pink/5 disabled:hover:text-secondary"
                  title="Create flight group"
                  aria-label="Create flight group"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {taskGroups.length === 0 ? (
              <div className="text-sm text-secondary/60 text-center italic">No active flights</div>
            ) : viewMode === 'all' ? (
              <div className="space-y-2">
                {selectedTask && (
                  <div className="mb-1 flex justify-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-synthwave-pink/30 bg-synthwave-pink/10 px-2 py-1 text-xs text-synthwave-pink">
                      <span className="retro-font">{selectedTask}</span>
                      <button
                        onClick={() => setSelectedTask(null)}
                        className="rounded-full text-secondary transition-colors hover:bg-synthwave-pink/15 hover:text-white"
                        title="Remove task filter"
                        aria-label="Remove task filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                )}
                {visibleFlightGroups.map((group) => (
                  <FlightGroupCard
                    key={group.id}
                    group={group}
                    isAirborne={hasFlightGroupTakenOff(group, currentTime)}
                    selected={selectedItem?.id === group.id}
                    showClientControls={selectedItem?.id === group.id}
                    onClientCountChange={(count) =>
                      activeStore.send({
                        type: 'setFlightGroupClientCount',
                        flightGroupId: group.id,
                        count
                      })
                    }
                    onClick={() => onSelect(selectedItem?.id === group.id ? null : group)}
                    onMouseEnter={() => onPreview(group)}
                    onMouseLeave={() => onPreview(null)}
                  />
                ))}
              </div>
            ) : !selectedTask ? (
              <div className="grid grid-cols-2 gap-2">
                {taskGroups.map(({ task, groups }) => {
                  const totalClients = groups.reduce(
                    (sum, group) =>
                      sum + group.aircrafts.filter((aircraft) => aircraft.client).length,
                    0
                  )
                  const airborneCount = groups.filter((group) =>
                    hasFlightGroupTakenOff(group, currentTime)
                  ).length

                  return (
                    <button
                      key={task}
                      onClick={() => {
                        setSelectedTask(task)
                        setViewMode('all')
                      }}
                      className="flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-lg border border-synthwave-pink/20 bg-synthwave-pink/5 p-3 text-center transition-colors hover:border-synthwave-pink/50 hover:bg-synthwave-pink/15"
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
            ) : null}
          </div>
        </CardContent>
      </ScrollArea>
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent
          className="border-synthwave-pink/30 bg-synthwave-dark/95 text-synthwave-light shadow-[0_0_30px_rgba(255,0,170,0.4)] backdrop-blur-xl sm:max-w-md"
          showCloseButton={false}
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-synthwave-pink" />
              <DialogTitle className="text-synthwave-cyan retro-font">New Flight</DialogTitle>
            </div>
            <DialogDescription className="text-secondary/70">
              Choose the task for the new player flight group
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {MANUAL_FLIGHT_TASKS.map((task) => {
              const groups = taskGroups.find((group) => group.task === task)?.groups ?? []
              const totalClients = groups.reduce(
                (sum, group) => sum + group.aircrafts.filter((aircraft) => aircraft.client).length,
                0
              )
              const airborneCount = groups.filter((group) =>
                hasFlightGroupTakenOff(group, currentTime)
              ).length
              const canCreateTask = creatableTasks.has(task)

              return (
                <button
                  key={task}
                  disabled={!canCreateTask}
                  onClick={() => {
                    if (!canCreateTask) return

                    activeStore.send({
                      type: 'createManualPlayerFlightGroup',
                      task
                    })
                    setSelectedTask(task)
                    setViewMode('all')
                    setIsNewDialogOpen(false)
                  }}
                  className="flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-lg border border-synthwave-pink/20 bg-synthwave-pink/5 p-3 text-center transition-colors hover:border-synthwave-pink/50 hover:bg-synthwave-pink/15 disabled:cursor-not-allowed disabled:border-synthwave-pink/10 disabled:bg-synthwave-pink/[0.02] disabled:opacity-40 disabled:hover:border-synthwave-pink/10 disabled:hover:bg-synthwave-pink/[0.02]"
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
