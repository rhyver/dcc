import { createHashRouter, redirect, Outlet, useRouteError, Navigate } from 'react-router'
import { Home } from './routes/active/home/home'
import { Mission } from './routes/active/mission/mission'
import { ActiveLayout } from './routes/active/layout'
import { coreClient } from './lib/orpc'
import { New } from './routes/new'
import { Load } from './routes/load'
import { Settings } from './routes/settings'
import { MissionGenerator } from './routes/mission-generator/mission-generator'
import { activeStore } from './stores/active'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Maximize2, Minus, X } from 'lucide-react'

function RootLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleOpenCampaign = () => {
      navigate('/load')
    }

    const unsubscribe = window.api?.onMenuOpenCampaign(handleOpenCampaign)

    return () => {
      unsubscribe?.()
    }
  }, [navigate])

  return (
    <>
      <WindowFrameControls />
      <Outlet />
    </>
  )
}

function WindowFrameControls() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[5000] h-10">
      <div className="app-drag-region absolute inset-x-0 top-0 h-3" />
      <div className="app-no-drag absolute right-3 top-2 flex items-center gap-1">
        <button
          type="button"
          className="window-control-button"
          aria-label="Minimize window"
          onClick={() => void window.api?.minimizeWindow()}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="window-control-button"
          aria-label="Maximize or restore window"
          onClick={() => void window.api?.toggleMaximizeWindow()}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="window-control-button window-control-button-close"
          aria-label="Close window"
          onClick={() => void window.api?.closeWindow()}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

async function activeCampaignMiddleware() {
  const activeCampaign = await coreClient.campaign.getActiveCampaign()
  if (!activeCampaign) {
    throw redirect('/new')
  }
  console.log('loaded campaign', activeCampaign)
  activeStore.trigger.loadCampaign({ campaign: activeCampaign })
}

function ActiveCampaignErrorBoundary() {
  const error = useRouteError() as { message: string; code?: string }

  if (
    error?.message === 'INVALID_APP_STATE' ||
    error?.code === 'INVALID_APP_STATE' ||
    (typeof error?.message === 'string' && error.message.includes('INVALID_APP_STATE'))
  ) {
    return <Navigate to="/new" />
  }

  throw error
}

export const router = createHashRouter([
  {
    Component: RootLayout,
    children: [
      {
        path: '/',
        Component: ActiveLayout,
        middleware: [activeCampaignMiddleware],
        ErrorBoundary: ActiveCampaignErrorBoundary,
        children: [
          { index: true, Component: Home },
          { path: 'mission', Component: Mission }
        ]
      },
      {
        path: '/new',
        Component: New
      },
      {
        path: '/load',
        Component: Load
      },
      {
        path: '/settings',
        Component: Settings
      },
      {
        path: '/mission-generator',
        Component: MissionGenerator
      }
    ]
  }
])
