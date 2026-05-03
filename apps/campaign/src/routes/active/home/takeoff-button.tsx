import { useState } from 'react'
import { useSelector } from '@xstate/store/react'
import { FastForward, Plane, PlaneTakeoff } from 'lucide-react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { activeStore } from '@/stores/active'
import { coreClient } from '@/lib/orpc'
import { SelectFlightDialog } from './select-flight-dialog'

export function TakeoffButton() {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const clientFlightGroup = useSelector(activeStore, (state) =>
    state.context.coalitions.player.flightGroups.find((fg) => fg.aircrafts.some((ac) => ac.client))
  )
  const campaignTime = useSelector(activeStore, (state) => state.context.time)

  const hasClient = !!clientFlightGroup

  const startTime = clientFlightGroup ? new Date(clientFlightGroup.flightplan.startTime) : null
  const currentTime = campaignTime ? new Date(campaignTime) : new Date()
  const isBeforeTakeoff = startTime && currentTime < startTime

  const selectFlightButton = (primary = false) => (
    <Button
      size="sm"
      variant="outline"
      className={`tactical-button h-10 w-full rounded-md px-4 ${
        primary ? 'tactical-action-button text-white' : 'text-secondary'
      }`}
      onClick={() => setDialogOpen(true)}
    >
      <Plane className="mr-1.5 h-4 w-4" />
      Select Flight
    </Button>
  )

  if (!hasClient) {
    return (
      <div className="grid flex-1 min-w-0 grid-cols-1">
        {selectFlightButton(true)}
        <SelectFlightDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    )
  }

  if (isBeforeTakeoff && startTime) {
    return (
      <div className="grid flex-1 min-w-0 grid-cols-2 gap-2">
        {selectFlightButton()}
        <Button
          size="sm"
          className="tactical-button tactical-action-button h-10 w-full rounded-md text-white"
          onClick={() => {
            activeStore.trigger.setTimeTarget({ timeTarget: startTime })
            activeStore.trigger.updateTimeMultiplier({ timeMultiplier: 300 })
          }}
        >
          <FastForward className="mr-2 h-4 w-4" />
          Forward to takeoff
        </Button>
        <SelectFlightDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    )
  }

  return (
    <div className="grid flex-1 min-w-0 grid-cols-2 gap-2">
      {selectFlightButton()}
      <Button
        size="sm"
        className="tactical-button tactical-action-button h-10 w-full rounded-md text-white"
        onClick={async () => {
          if (!hasClient || isSaving) return
          setIsSaving(true)
          try {
            await coreClient.campaign.saveActiveCampaign(activeStore.getSnapshot().context)
            navigate('/mission')
          } finally {
            setIsSaving(false)
          }
        }}
        disabled={!hasClient || isSaving}
      >
        {!isSaving && <PlaneTakeoff className="mr-2 h-4 w-4" />}
        {isSaving ? 'Saving…' : 'Takeoff'}
      </Button>
      <SelectFlightDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
