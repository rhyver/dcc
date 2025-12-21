import { Outlet, useNavigate } from 'react-router'
import { useTick } from './tick'
import { useEffect } from 'react'
import { coreClient } from '@/lib/orpc'
import { activeStore } from '@/stores/active'

export function ActiveLayout() {
  useTick()
  const navigate = useNavigate()

  useEffect(() => {
    const handleSaveCampaign = async () => {
      await coreClient.campaign.saveActiveCampaign({
        ...activeStore.getSnapshot().context,
        timeMultiplier: 0
      })
    }

    const handleExportMission = async () => {
      await coreClient.campaign.generateMiz(activeStore.getSnapshot().context)
    }

    const handleReturnToMenu = () => {
      navigate('/new')
    }

    const handleRemoveAllFlightGroups = () => {
      activeStore.send({ type: 'removeAllFlightGroups' })
    }

    // Register menu event listeners
    const unsubscribeSave = window.api?.onMenuSaveCampaign(handleSaveCampaign)
    const unsubscribeExport = window.api?.onMenuExportMission(handleExportMission)
    const unsubscribeReturn = window.api?.onMenuReturnToMenu(handleReturnToMenu)
    const unsubscribeRemoveFlightGroups = window.api?.onMenuRemoveFlightGroups(
      handleRemoveAllFlightGroups
    )

    return () => {
      unsubscribeSave?.()
      unsubscribeExport?.()
      unsubscribeReturn?.()
      unsubscribeRemoveFlightGroups?.()
    }
  }, [navigate])

  return (
    <div>
      <Outlet />
    </div>
  )
}
