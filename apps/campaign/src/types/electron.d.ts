import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  onMenuSaveCampaign: (callback: () => void) => () => void
  onMenuExportMission: (callback: () => void) => () => void
  onMenuOpenCampaign: (callback: () => void) => () => void
  onMenuReturnToMenu: (callback: () => void) => () => void
  onMenuRemoveFlightGroups: (callback: () => void) => () => void
  logActionEntry: (entry: unknown) => void
  selectDirectory: () => Promise<string | null>
  getAppVersion: () => Promise<string>
  minimizeWindow: () => Promise<void>
  toggleMaximizeWindow: () => Promise<void>
  getWindowMaximized: () => Promise<boolean>
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void
  openDevTools: () => Promise<void>
  openUserDataFolder: () => Promise<void>
  closeWindow: () => Promise<void>
  sendMissionGeneratorChat: (messages: { role: 'user' | 'assistant'; content: string }[]) => void
  onMissionGeneratorChatChunk: (callback: (chunk: string) => void) => () => void
  onMissionGeneratorChatEnd: (callback: () => void) => () => void
  onMissionGeneratorChatError: (callback: (message: string) => void) => () => void
}

declare global {
  interface Window {
    electron?: ElectronAPI
    api?: API
  }
}

export {}
