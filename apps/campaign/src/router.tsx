import { createBrowserRouter, redirect } from 'react-router'
import { Home } from './routes/active/home/home'
import { ActiveLayout } from './routes/active/layout'
import { coreClient } from './lib/orpc'
import { New } from './routes/new'
import { activeStore } from './stores/active'

async function activeCampaignMiddleware() {
  const activeCampaign = await coreClient.campaign.getActiveCampaign()
  if (!activeCampaign) {
    throw redirect('/new')
  }
  console.log('loaded campaign', activeCampaign)
  activeStore.trigger.loadCampaign({ campaign: activeCampaign })
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: ActiveLayout,
    middleware: [activeCampaignMiddleware],
    children: [{ index: true, Component: Home }]
  },
  {
    path: '/new',
    Component: New
  }
])
