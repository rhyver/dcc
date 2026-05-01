import {
  createHashRouter,
  redirect,
  Outlet,
  useRouteError,
  Navigate,
  useLocation
} from 'react-router'
import { coreClient } from './lib/orpc'
import { activeStore } from './stores/active'
import { uiStore } from './stores/ui'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useSelector } from '@xstate/store/react'
import {
  AlertTriangle,
  Archive,
  FolderOpen,
  Maximize2,
  Minimize2,
  Minus,
  ScrollText,
  Settings,
  X
} from 'lucide-react'
import { debugLog } from './lib/debug'

function RootLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [pathWarnings, setPathWarnings] = useState<{ title: string; detail: string }[]>([])

  useEffect(() => {
    const handleOpenCampaign = () => {
      navigate('/load')
    }

    const unsubscribe = window.api?.onMenuOpenCampaign(handleOpenCampaign)

    return () => {
      unsubscribe?.()
    }
  }, [navigate])

  useEffect(() => {
    let cancelled = false

    coreClient.campaign.getSettings().then((settings) => {
      if (cancelled) {
        return
      }

      const warnings: { title: string; detail: string }[] = []

      const missionExportSet = (settings.missionExportPath ?? '').trim().length > 0
      const missionExportDetected = (settings.detectedMissionExportPath ?? '').trim().length > 0
      if (!missionExportSet && !missionExportDetected) {
        warnings.push({
          title: 'Mission export path missing.',
          detail: 'No path set and no DCS Saved Games folder was found.'
        })
      }

      const dcsInstallSet = (settings.dcsInstallPath ?? '').trim().length > 0
      const dcsInstallDetected = (settings.detectedDcsInstallPath ?? '').trim().length > 0
      if (!dcsInstallSet && !dcsInstallDetected) {
        const persistenceEnabled = settings.enableDcsPersistence ?? true
        warnings.push({
          title: 'DCS install path missing.',
          detail: persistenceEnabled
            ? 'Set your DCS install path or disable persistence.'
            : 'No DCS World install was found.'
        })
      }

      setPathWarnings(warnings)
    })

    return () => {
      cancelled = true
    }
  }, [location.key])

  return (
    <div className="flex h-screen flex-col">
      <AppTitleBar />
      <div className="relative min-h-0 flex-1">
        {pathWarnings.length > 0 ? (
          <PathWarningBanner warnings={pathWarnings} onOpenSettings={() => navigate('/settings')} />
        ) : null}
        <Outlet />
      </div>
    </div>
  )
}

function PathWarningBanner({
  warnings,
  onOpenSettings
}: {
  warnings: { title: string; detail: string }[]
  onOpenSettings: () => void
}) {
  return (
    <div className="app-no-drag absolute left-3 right-3 top-2 z-4990 rounded border border-amber-400/60 bg-amber-950/95 px-3 py-2 text-amber-100 shadow-lg shadow-black/30 backdrop-blur">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
        <div className="min-w-0 flex-1 space-y-1 text-xs sm:text-sm">
          {warnings.map((warning) => (
            <div key={warning.title}>
              <span className="font-semibold">{warning.title}</span>{' '}
              <span className="text-amber-100/80">{warning.detail}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded border border-amber-300/50 px-2 text-xs font-semibold text-amber-50 hover:bg-amber-300/15"
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </button>
      </div>
    </div>
  )
}

function AppTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false)
  const isLogOpen = useSelector(uiStore, (state) => state.context.isLogOpen)
  const logEntries = useSelector(activeStore, (state) => state.context.logs)

  useEffect(() => {
    let cancelled = false

    window.api?.getWindowMaximized?.().then((nextIsMaximized) => {
      if (!cancelled) {
        setIsMaximized(nextIsMaximized)
      }
    })

    const unsubscribe = window.api?.onWindowMaximizedChange?.(setIsMaximized)

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  const MaximizeIcon = isMaximized ? Minimize2 : Maximize2

  return (
    <div className="app-drag-region relative z-5000 flex h-10 shrink-0 items-center border-b border-synthwave-pink/20 bg-synthwave-dark/88 px-3 text-synthwave-light shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-md">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="retro-font shrink-0 text-sm font-semibold tracking-wide text-synthwave-cyan">
          DCC
        </div>
        <div className="app-no-drag relative">
          <button
            type="button"
            className="titlebar-menu-button"
            aria-haspopup="menu"
            aria-expanded={isDevMenuOpen}
            onClick={() => setIsDevMenuOpen((open) => !open)}
          >
            Dev
          </button>
          {isDevMenuOpen ? (
            <div className="titlebar-menu" role="menu">
              <button
                type="button"
                className="titlebar-menu-item"
                role="menuitem"
                onClick={() => {
                  setIsDevMenuOpen(false)
                  void window.api?.openDevTools?.()
                }}
              >
                Show Chrome DevTools
              </button>
              <button
                type="button"
                className="titlebar-menu-item"
                role="menuitem"
                onClick={() => {
                  setIsDevMenuOpen(false)
                  uiStore.trigger.toggleLog()
                }}
              >
                <span className="flex items-center gap-2">
                  <ScrollText className="h-3.5 w-3.5" />
                  {isLogOpen ? 'Hide' : 'Show'} Action Log
                  <span className="ml-auto text-[10px] opacity-70">{logEntries.length}</span>
                </span>
              </button>
              <button
                type="button"
                className="titlebar-menu-item"
                role="menuitem"
                onClick={() => {
                  setIsDevMenuOpen(false)
                  void window.api?.openUserDataFolder?.()
                }}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="h-3.5 w-3.5" />
                  Open User Data Folder
                </span>
              </button>
              <button
                type="button"
                className="titlebar-menu-item"
                role="menuitem"
                onClick={() => {
                  setIsDevMenuOpen(false)
                  void window.api?.createDebugBundle?.()
                }}
              >
                <span className="flex items-center gap-2">
                  <Archive className="h-3.5 w-3.5" />
                  Create Debug Bundle
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="app-no-drag flex shrink-0 items-center gap-1">
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
          aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
          onClick={() => void window.api?.toggleMaximizeWindow()}
        >
          <MaximizeIcon className="h-3.5 w-3.5" />
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
  debugLog('loaded campaign', activeCampaign)
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
        lazy: async () => {
          const { ActiveLayout } = await import('./routes/active/layout')
          return { Component: ActiveLayout }
        },
        middleware: [activeCampaignMiddleware],
        ErrorBoundary: ActiveCampaignErrorBoundary,
        children: [
          {
            index: true,
            lazy: async () => {
              const { Home } = await import('./routes/active/home/home')
              return { Component: Home }
            }
          },
          {
            path: 'mission',
            lazy: async () => {
              const { Mission } = await import('./routes/active/mission/mission')
              return { Component: Mission }
            }
          }
        ]
      },
      {
        path: '/new',
        lazy: async () => {
          const { New } = await import('./routes/new')
          return { Component: New }
        }
      },
      {
        path: '/load',
        lazy: async () => {
          const { Load } = await import('./routes/load')
          return { Component: Load }
        }
      },
      {
        path: '/settings',
        lazy: async () => {
          const { Settings } = await import('./routes/settings')
          return { Component: Settings }
        }
      },
      {
        path: '/mission-generator',
        lazy: async () => {
          const { MissionGenerator } = await import('./routes/mission-generator/mission-generator')
          return { Component: MissionGenerator }
        }
      }
    ]
  }
])
