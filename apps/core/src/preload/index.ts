import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  onMenuSaveCampaign: (callback: () => void) => {
    ipcRenderer.on('menu-save-campaign', callback)
    return () => ipcRenderer.removeListener('menu-save-campaign', callback)
  },
  onMenuExportMission: (callback: () => void) => {
    ipcRenderer.on('menu-export-mission', callback)
    return () => ipcRenderer.removeListener('menu-export-mission', callback)
  },
  onMenuOpenCampaign: (callback: () => void) => {
    ipcRenderer.on('menu-open-campaign', callback)
    return () => ipcRenderer.removeListener('menu-open-campaign', callback)
  },
  onMenuReturnToMenu: (callback: () => void) => {
    ipcRenderer.on('menu-return-to-menu', callback)
    return () => ipcRenderer.removeListener('menu-return-to-menu', callback)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

window.addEventListener('message', (event) => {
  if (event.data === 'start-orpc-client') {
    const [serverPort] = event.ports

    ipcRenderer.postMessage('start-orpc-server', null, [serverPort])
  }
})
