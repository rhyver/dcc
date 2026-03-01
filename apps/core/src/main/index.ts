import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { rpcHandler } from './api'
import { readFile, parseJson, writeFile } from './utils'
import { enableDcsPersistenceForAppRuntime } from './dcs-persistence'
import { registerMissionGeneratorChatHandlers } from './api/mission-generator/chat-handler'

let mainWindow: BrowserWindow | null = null
const stateFile = join(app.getPath('userData'), 'state.json')
const RESTORABLE_PATHS = new Set(['/', '/mission', '/new', '/load', '/settings', '/mission-generator'])

async function getLastViewPath() {
  const file = await readFile(stateFile)
  if (file.isErr()) {
    return '/'
  }

  const parsed = parseJson(file.value)
  if (parsed.isErr()) {
    return '/'
  }

  const state = parsed.value as { settings?: { lastViewPath?: string } }
  const path = state.settings?.lastViewPath
  if (typeof path === 'string' && RESTORABLE_PATHS.has(path)) {
    return path
  }
  return '/'
}

async function setLastViewPath(pathname: string) {
  if (!RESTORABLE_PATHS.has(pathname)) {
    return
  }

  let current: Record<string, unknown> = {}
  const file = await readFile(stateFile)
  if (file.isOk()) {
    const parsed = parseJson(file.value)
    if (parsed.isOk() && parsed.value != null && typeof parsed.value === 'object') {
      current = parsed.value as Record<string, unknown>
    }
  }

  const settings =
    current.settings != null && typeof current.settings === 'object'
      ? (current.settings as Record<string, unknown>)
      : {}

  await writeFile(stateFile, {
    ...current,
    settings: {
      ...settings,
      lastViewPath: pathname
    }
  })
}

function getPathFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    const hash = parsed.hash
    if (!hash) {
      return '/'
    }
    const rawPath = hash.startsWith('#') ? hash.slice(1) : hash
    const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
    return RESTORABLE_PATHS.has(normalizedPath) ? normalizedPath : null
  } catch {
    return null
  }
}

function withHashPath(baseUrl: string, path: string) {
  const safePath = RESTORABLE_PATHS.has(path) ? path : '/'
  return `${baseUrl}#${safePath}`
}

function createMenu() {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Save Campaign',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu-save-campaign')
          }
        },
        {
          label: 'Export Mission',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow?.webContents.send('menu-export-mission')
          }
        },
        { type: 'separator' as const },
        {
          label: 'Open Campaign...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu-open-campaign')
          }
        },
        {
          label: 'Return to Menu',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow?.webContents.send('menu-return-to-menu')
          }
        },
        { type: 'separator' as const },
        isMac ? { role: 'close' as const } : { role: 'quit' as const }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' as const },
              { role: 'delete' as const },
              { role: 'selectAll' as const },
              { type: 'separator' as const },
              {
                label: 'Speech',
                submenu: [{ role: 'startSpeaking' as const }, { role: 'stopSpeaking' as const }]
              }
            ]
          : [
              { role: 'delete' as const },
              { type: 'separator' as const },
              { role: 'selectAll' as const }
            ])
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const }
      ]
    },
    {
      label: 'Developer',
      submenu: [
        {
          label: 'Remove All Flight Groups',
          click: () => {
            mainWindow?.webContents.send('menu-remove-flight-groups')
          }
        },
        {
          label: 'Open Save File',
          click: async () => {
            const stateFile = join(app.getPath('userData'), 'state.json')
            const fileResult = await readFile(stateFile)

            if (fileResult.isErr()) {
              return
            }

            const parsedState = parseJson(fileResult.value)

            if (parsedState.isErr()) {
              return
            }

            const state = parsedState.value as { activeCampaignId?: string }

            if (!state.activeCampaignId) {
              return
            }

            const campaignPath = join(
              app.getPath('userData'),
              'campaigns',
              `${state.activeCampaignId}.json`
            )

            await shell.openPath(campaignPath)
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const }
            ]
          : [{ role: 'close' as const }])
      ]
    },
    {
      role: 'help' as const,
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://electronjs.org')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

async function createWindow(): Promise<void> {
  console.log('createWindow')
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    console.log('ready-to-show')
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  const persistPathFromUrl = (url: string) => {
    const path = getPathFromUrl(url)
    if (!path) {
      return
    }
    void setLastViewPath(path).catch((error) => {
      console.error('Failed to persist last view path:', error)
    })
  }

  mainWindow.webContents.on('did-navigate', (_event, url) => {
    persistPathFromUrl(url)
  })
  mainWindow.webContents.on('did-navigate-in-page', (_event, url) => {
    persistPathFromUrl(url)
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  const startupPath = await getLastViewPath()
  const CAMPAIGN_URL = process.env.CAMPAIGN_URL
  if (is.dev && CAMPAIGN_URL) {
    await mainWindow.loadURL(withHashPath(CAMPAIGN_URL, startupPath))
  } else {
    await mainWindow.loadFile(join(process.resourcesPath, 'renderer/campaign/index.html'), {
      hash: startupPath
    })
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  console.log('whenReady')
  enableDcsPersistenceForAppRuntime()
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Create the application menu
  createMenu()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('start-orpc-server', async (event) => {
    const [serverPort] = event.ports
    rpcHandler.upgrade(serverPort)
    serverPort.start()
  })

  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    })
    if (canceled) {
      return null
    } else {
      return filePaths[0]
    }
  })

  registerMissionGeneratorChatHandlers(ipcMain, () => mainWindow)

  void createWindow()

  app.on('activate', function () {
    console.log('activate')
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
