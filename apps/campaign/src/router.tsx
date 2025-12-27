import { createHashRouter, redirect, Outlet, useRouteError, Navigate } from 'react-router'
import { Home } from './routes/active/home/home'
import { ActiveLayout } from './routes/active/layout'
import { coreClient } from './lib/orpc'
import { New } from './routes/new'
import { Load } from './routes/load'
import { Settings } from './routes/settings'
import { activeStore } from './stores/active'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'

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

  return <Outlet />
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
        children: [{ index: true, Component: Home }]
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
      }
    ]
  }
])
