import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  onMenuSaveCampaign: (callback: () => void) => () => void
  onMenuExportMission: (callback: () => void) => () => void
  onMenuOpenCampaign: (callback: () => void) => () => void
  onMenuReturnToMenu: (callback: () => void) => () => void
  onMenuRemoveFlightGroups: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electron?: ElectronAPI
    api?: API
  }
}

export {}
