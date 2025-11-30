import { createHashRouter, redirect, Outlet } from 'react-router'
import { Home } from './routes/active/home/home'
import { ActiveLayout } from './routes/active/layout'
import { coreClient } from './lib/orpc'
import { New } from './routes/new'
import { Load } from './routes/load'
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

export const router = createHashRouter([
  {
    Component: RootLayout,
    children: [
      {
        path: '/',
        Component: ActiveLayout,
        middleware: [activeCampaignMiddleware],
        children: [{ index: true, Component: Home }]
      },
      {
        path: '/new',
        Component: New
      },
      {
        path: '/load',
        Component: Load
      }
    ]
  }
])
