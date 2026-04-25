import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import { rpcHandler } from './api'
import { readFile, parseJson, writeFile } from './utils'
import { enableDcsPersistenceForAppRuntime } from './dcs-persistence'
import { registerMissionGeneratorChatHandlers } from './api/mission-generator/chat-handler'

let mainWindow: BrowserWindow | null = null
const stateFile = join(app.getPath('userData'), 'state.json')
const RESTORABLE_PATHS = new Set([
  '/',
  '/mission',
  '/new',
  '/load',
  '/settings',
  '/mission-generator'
])

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

async function isAutoUpdateDisabled() {
  const file = await readFile(stateFile)
  if (file.isErr()) {
    return false
  }
  const parsed = parseJson(file.value)
  if (parsed.isErr()) {
    return false
  }
  const state = parsed.value as { settings?: { disableAutoUpdate?: boolean } }
  return state.settings?.disableAutoUpdate === true
}

let updateWindow: BrowserWindow | null = null
let updateWindowReady = false
type UpdateUiState = { status: string; percent?: number; meta?: string }
let pendingUpdateUi: UpdateUiState | null = null

const updateHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0a0a14; color: #e0e0ff; height: 100vh;
    display: flex; align-items: center; justify-content: center;
    -webkit-app-region: drag; user-select: none; }
  .card { width: 100%; padding: 24px 28px; box-sizing: border-box; }
  h1 { margin: 0 0 8px 0; font-size: 14px; color: #ff6ec7;
    letter-spacing: 0.08em; text-transform: uppercase; }
  p { margin: 0 0 14px 0; font-size: 13px; color: #c0c0e0; }
  .bar { height: 8px; background: rgba(255,255,255,0.08);
    border-radius: 4px; overflow: hidden; }
  .fill { height: 100%; width: 0%;
    background: linear-gradient(90deg, #ff6ec7, #4dd0e1);
    transition: width 0.2s ease; }
  .meta { margin-top: 8px; font-size: 11px; color: #707090;
    font-variant-numeric: tabular-nums; }
</style></head><body>
  <div class="card">
    <h1>Updating Digital Crew Chief</h1>
    <p id="status">Preparing update...</p>
    <div class="bar"><div class="fill" id="fill"></div></div>
    <div class="meta" id="meta"></div>
  </div>
</body></html>`

function ensureUpdateWindow(): BrowserWindow {
  if (updateWindow && !updateWindow.isDestroyed()) {
    return updateWindow
  }
  updateWindowReady = false
  const win = new BrowserWindow({
    width: 440,
    height: 180,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    alwaysOnTop: true,
    show: false,
    skipTaskbar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  })
  void win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(updateHtml)}`)
  win.once('ready-to-show', () => win.show())
  win.webContents.once('did-finish-load', () => {
    updateWindowReady = true
    if (pendingUpdateUi) {
      applyUpdateUi(pendingUpdateUi)
      pendingUpdateUi = null
    }
  })
  win.on('closed', () => {
    updateWindow = null
    updateWindowReady = false
  })
  updateWindow = win
  return win
}

function applyUpdateUi(state: UpdateUiState) {
  if (!updateWindow || updateWindow.isDestroyed()) return
  const percentJs = state.percent == null ? "'0%'" : `(${state.percent}) + '%'`
  const js = `(function(){
    var s=document.getElementById('status'); if(s) s.textContent=${JSON.stringify(state.status)};
    var f=document.getElementById('fill'); if(f) f.style.width=${percentJs};
    var m=document.getElementById('meta'); if(m) m.textContent=${JSON.stringify(state.meta ?? '')};
  })();`
  updateWindow.webContents.executeJavaScript(js, true).catch(() => {})
}

function setUpdateUi(state: UpdateUiState) {
  if (!updateWindow || updateWindow.isDestroyed()) return
  if (!updateWindowReady) {
    pendingUpdateUi = state
    return
  }
  applyUpdateUi(state)
}

function startAutoUpdate() {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('update-available', (info) => {
    ensureUpdateWindow()
    setUpdateUi({ status: `Downloading version ${info.version}...`, percent: 0 })
  })
  autoUpdater.on('download-progress', (p) => {
    const pct = Math.round(p.percent)
    const transferred = (p.transferred / 1024 / 1024).toFixed(1)
    const total = (p.total / 1024 / 1024).toFixed(1)
    setUpdateUi({
      status: 'Downloading update...',
      percent: pct,
      meta: `${transferred} MB / ${total} MB · ${pct}%`
    })
  })
  autoUpdater.on('update-downloaded', () => {
    setUpdateUi({ status: 'Installing update...', percent: 100, meta: 'Restarting to apply.' })
    setTimeout(() => autoUpdater.quitAndInstall(), 800)
  })
  autoUpdater.on('error', (error) => {
    console.error('Auto-update error:', error)
    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.close()
    }
  })

  autoUpdater.checkForUpdates().catch((error) => {
    console.error('Auto-update check failed:', error)
  })
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

async function createWindow(): Promise<void> {
  console.log('createWindow')
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    frame: false,
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
  electronApp.setAppUserModelId('at.digitalcrewchief.app')

  // Remove the application menu bar
  Menu.setApplicationMenu(null)

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

  ipcMain.handle('app:getVersion', () => app.getVersion())
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })
  ipcMain.handle('window:toggleMaximize', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
      return
    }
    mainWindow.maximize()
  })
  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })

  registerMissionGeneratorChatHandlers(ipcMain, () => mainWindow)

  void createWindow()

  if (!is.dev && process.platform === 'win32') {
    void isAutoUpdateDisabled().then((disabled) => {
      if (disabled) {
        console.log('Auto-update disabled in settings; skipping update check.')
        return
      }
      startAutoUpdate()
    })
  }

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
