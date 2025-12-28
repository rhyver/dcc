import { useSelector } from '@xstate/store/react'
import { FastForward } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { activeStore } from '@/stores/active'
import { coreClient } from '@/lib/orpc'

export function TakeoffButton() {
    const clientFlightGroup = useSelector(activeStore, (state) =>
        state.context.coalitions.player.flightGroups.find((fg) => fg.aircrafts.some((ac) => ac.client))
    )
    const campaignTime = useSelector(activeStore, (state) => state.context.time)

    const hasClient = !!clientFlightGroup

    // Safe parsing of dates
    const startTime = clientFlightGroup ? new Date(clientFlightGroup.flightplan.startTime) : null
    const currentTime = campaignTime ? new Date(campaignTime) : new Date()

    const isBeforeTakeoff = startTime && currentTime < startTime

    if (isBeforeTakeoff && startTime) {
        return (
            <Button
                size="sm"
                className="h-8 bg-synthwave-pink hover:bg-synthwave-pink/80 text-white border-none shadow-[0_0_10px_rgba(255,0,170,0.5)]"
                onClick={() => {
                    activeStore.trigger.setTimeTarget({ timeTarget: startTime })
                    activeStore.trigger.updateTimeMultiplier({ timeMultiplier: 300 })
                }}
            >
                <FastForward className="mr-2 h-4 w-4" />
                Forward to takeoff
            </Button>
        )
    }

    return (
        <Button
            size="sm"
            className="h-8 bg-synthwave-pink hover:bg-synthwave-pink/80 text-white border-none shadow-[0_0_10px_rgba(255,0,170,0.5)]"
            onClick={() => coreClient.campaign.generateMiz(activeStore.getSnapshot().context)}
            disabled={!hasClient}
        >
            Takeoff
        </Button>
    )
}
