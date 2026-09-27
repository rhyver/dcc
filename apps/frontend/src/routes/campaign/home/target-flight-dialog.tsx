import { Crosshair, PlaneTakeoff } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSelector } from '@xstate/store/react'
import type { z } from 'zod'
import { schemas } from '@dcc/contracts'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { canCreateManualFlightGroup } from '@/logic/systems/spawn/manual-flight-group'
import { hasFlightGroupTakenOff } from '@/logic/entities/flight-status'
import { activeStore } from '@/stores/active'
import { FlightGroupCard } from '../components/flight-group-card'

type FlightTask = z.infer<typeof schemas.task>
type FlightGroup = z.infer<typeof schemas.flightGroup>
type TargetType = 'Ground Group' | 'Structure' | 'SAM' | 'EWR'

const TARGET_TASKS: Record<TargetType, readonly FlightTask[]> = {
  'Ground Group': ['CAS'],
  Structure: ['Pinpoint Strike'],
  SAM: ['DEAD', 'SEAD'],
  EWR: ['DEAD', 'SEAD']
}

export function TargetFlightDialog({
  target,
  onSelectFlight
}: {
  target: { id: string; name: string; type: TargetType }
  onSelectFlight?: (flightGroup: FlightGroup) => void
}) {
  const [open, setOpen] = useState(false)
  const campaign = useSelector(activeStore, (state) => state.context)
  const tasks = TARGET_TASKS[target.type]
  const availableTasks = useMemo(
    () =>
      new Set(
        tasks.filter((task) =>
          canCreateManualFlightGroup(campaign, 'player', task, { id: target.id })
        )
      ),
    [campaign, target.id, tasks]
  )
  const canPlanFlight = availableTasks.size > 0
  const assignedFlights = useMemo(
    () =>
      campaign.coalitions.player.flightGroups.filter(
        (flightGroup) => flightGroup.target?.id === target.id
      ),
    [campaign.coalitions.player.flightGroups, target.id]
  )

  if (assignedFlights.length > 0) {
    return (
      <div className="mt-4 border-t border-synthwave-pink/10 pt-3">
        <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-secondary/70">
          <PlaneTakeoff className="h-3.5 w-3.5 text-synthwave-cyan" />
          Planned {assignedFlights.length === 1 ? 'flight' : 'flights'}
        </div>
        <div className="space-y-2">
          {assignedFlights.map((flightGroup) => (
            <FlightGroupCard
              key={flightGroup.id}
              group={flightGroup}
              isAirborne={hasFlightGroupTakenOff(flightGroup, campaign.time)}
              showAircraftType
              onClick={onSelectFlight ? () => onSelectFlight(flightGroup) : undefined}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        disabled={!canPlanFlight}
        onClick={() => setOpen(true)}
        className="tactical-button mt-4 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-synthwave-cyan transition-colors hover:border-synthwave-cyan/55 hover:bg-synthwave-cyan/10 disabled:cursor-not-allowed disabled:opacity-40"
        title={
          canPlanFlight
            ? `Create a flight targeting ${target.name}`
            : `No flight can currently be created for ${target.name}`
        }
      >
        <Crosshair className="h-4 w-4" />
        {canPlanFlight ? 'Plan flight' : 'Flight unavailable'}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="tactical-panel text-synthwave-light backdrop-blur-xl sm:max-w-md"
          showCloseButton={false}
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              <PlaneTakeoff className="h-5 w-5 text-synthwave-pink" />
              <DialogTitle className="retro-font text-synthwave-cyan">New Flight</DialogTitle>
            </div>
            <DialogDescription className="text-secondary/70">
              Choose a mission for <span className="text-primary">{target.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {tasks.map((task) => {
              const canCreateTask = availableTasks.has(task)

              return (
                <button
                  key={task}
                  type="button"
                  disabled={!canCreateTask}
                  onClick={() => {
                    if (!canCreateTask) return

                    activeStore.send({
                      type: 'createManualPlayerFlightGroup',
                      task,
                      target: { id: target.id }
                    })
                    setOpen(false)
                  }}
                  className="tactical-button flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-md p-3 text-center transition-colors hover:border-synthwave-pink/50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="text-sm font-medium text-primary">{task}</span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-secondary/70">
                    {canCreateTask ? 'Ready' : 'Unavailable'}
                  </span>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
