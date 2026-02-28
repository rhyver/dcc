import { Outlet, useNavigate } from 'react-router'
import { useTick } from './tick'
import { useEffect, useRef } from 'react'
import { coreClient } from '@/lib/orpc'
import { activeStore } from '@/stores/active'
import { useSelector } from '@xstate/store/react'

const AUTOSAVE_INTERVAL_MS = 5_000

export function ActiveLayout() {
  useTick()
  const navigate = useNavigate()
  const timeMultiplier = useSelector(activeStore, (state) => state.context.timeMultiplier)
  const autosaveInFlightRef = useRef(false)

  const saveCurrentCampaign = async (setTimeMultiplierToZero = false) => {
    if (autosaveInFlightRef.current) {
      return
    }

    autosaveInFlightRef.current = true
    try {
      const snapshot = activeStore.getSnapshot().context
      await coreClient.campaign.saveActiveCampaign({
        ...snapshot,
        ...(setTimeMultiplierToZero ? { timeMultiplier: 0 } : {})
      })
    } catch (error) {
      console.error('Failed to save campaign:', error)
    } finally {
      autosaveInFlightRef.current = false
    }
  }

  useEffect(() => {
    const handleSaveCampaign = async () => {
      await saveCurrentCampaign(true)
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

  useEffect(() => {
    if (timeMultiplier <= 0) {
      return
    }

    const autosaveInterval = setInterval(() => {
      void saveCurrentCampaign(false)
    }, AUTOSAVE_INTERVAL_MS)

    return () => {
      clearInterval(autosaveInterval)
    }
  }, [timeMultiplier])

  return (
    <div>
      <Outlet />
    </div>
  )
}
