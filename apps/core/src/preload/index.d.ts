import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  onMenuSaveCampaign: (callback: () => void) => () => void
  onMenuExportMission: (callback: () => void) => () => void
  onMenuOpenCampaign: (callback: () => void) => () => void
  onMenuReturnToMenu: (callback: () => void) => () => void
  onMenuRemoveFlightGroups: (callback: () => void) => () => void
  sendMissionGeneratorChat: (messages: { role: 'user' | 'assistant'; content: string }[]) => void
  onMissionGeneratorChatChunk: (callback: (chunk: string) => void) => () => void
  onMissionGeneratorChatEnd: (callback: () => void) => () => void
  onMissionGeneratorChatError: (callback: (message: string) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
