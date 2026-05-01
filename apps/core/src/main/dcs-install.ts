import path from 'path'
import { existsSync } from 'fs'

const dcsExecutablePaths = [
  'bin/DCS.exe',
  'bin-mt/DCS.exe',
  'bin/DCS_server.exe',
  'bin-mt/DCS_server.exe'
]

export function validateDcsInstallPath(installPath: string) {
  const trimmedPath = installPath.trim()
  if (!trimmedPath) {
    return {
      valid: false,
      message: 'Select your DCS World installation folder.'
    }
  }

  const missionScriptingPath = path.join(trimmedPath, 'Scripts', 'MissionScripting.lua')
  if (!existsSync(missionScriptingPath)) {
    return {
      valid: false,
      message:
        'This does not look like the DCS World install root. Select the folder that contains bin/DCS.exe or bin/DCS_server.exe.'
    }
  }

  const hasDcsExecutable = dcsExecutablePaths.some((relativePath) =>
    existsSync(path.join(trimmedPath, relativePath))
  )

  if (!hasDcsExecutable) {
    return {
      valid: false,
      message:
        'This does not look like the DCS World install root. Select the folder that contains bin/DCS.exe or bin/DCS_server.exe.'
    }
  }

  return { valid: true, message: null }
}
