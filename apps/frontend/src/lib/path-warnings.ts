export type PathWarning = { title: string; detail: string }

export type PathSettingsSnapshot = {
  missionExportPath?: string
  dcsInstallPath?: string
  detectedMissionExportPath?: string
  detectedDcsInstallPath?: string
  enableDcsPersistence?: boolean
}

export function getPathWarningKey(warning: PathWarning) {
  return `${warning.title}:${warning.detail}`
}

export function buildPathWarnings(settings: PathSettingsSnapshot): PathWarning[] {
  const warnings: PathWarning[] = []

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

  return warnings
}

export function resolvePathsForSave(
  missionExportPath: string,
  dcsInstallPath: string,
  detectedMissionExportPath: string,
  detectedDcsInstallPath: string
) {
  return {
    missionExportPath: missionExportPath.trim() || detectedMissionExportPath.trim(),
    dcsInstallPath: dcsInstallPath.trim() || detectedDcsInstallPath.trim()
  }
}
