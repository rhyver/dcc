import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  CHAT_REQUEST_CHANNEL,
  CHAT_STREAM_CHANNEL,
  CHAT_STREAM_END_CHANNEL,
  CHAT_STREAM_ERROR_CHANNEL
} from '../shared/mission-generator-channels'

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
  },
  onMenuRemoveFlightGroups: (callback: () => void) => {
    ipcRenderer.on('menu-remove-flight-groups', callback)
    return () => ipcRenderer.removeListener('menu-remove-flight-groups', callback)
  },
  selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggleMaximize'),
  getWindowMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, isMaximized: boolean) =>
      callback(isMaximized)
    ipcRenderer.on('window:maximized-change', listener)
    return () => ipcRenderer.removeListener('window:maximized-change', listener)
  },
  openDevTools: () => ipcRenderer.invoke('devtools:open'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  sendMissionGeneratorChat: (messages: { role: 'user' | 'assistant'; content: string }[]) => {
    ipcRenderer.send(CHAT_REQUEST_CHANNEL, messages)
  },
  onMissionGeneratorChatChunk: (callback: (chunk: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, chunk: string) => callback(chunk)
    ipcRenderer.on(CHAT_STREAM_CHANNEL, listener)
    return () => ipcRenderer.removeListener(CHAT_STREAM_CHANNEL, listener)
  },
  onMissionGeneratorChatEnd: (callback: () => void) => {
    ipcRenderer.on(CHAT_STREAM_END_CHANNEL, callback)
    return () => ipcRenderer.removeListener(CHAT_STREAM_END_CHANNEL, callback)
  },
  onMissionGeneratorChatError: (callback: (message: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, message: string) => callback(message)
    ipcRenderer.on(CHAT_STREAM_ERROR_CHANNEL, listener)
    return () => ipcRenderer.removeListener(CHAT_STREAM_ERROR_CHANNEL, listener)
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
