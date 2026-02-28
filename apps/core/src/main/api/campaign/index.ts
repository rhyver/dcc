import { pub } from '../orpc'
import { app } from 'electron'
import path from 'path'
import { schemas } from '@dcc/contracts'
import {
  neverthrowParse,
  NotFoundError,
  parseJson,
  readFile,
  writeFile,
  readDirectory,
  ensureDirectory,
  deleteFile
} from '../../utils'
import { createCampaign } from './create-campaign'
import { generateMizFromCampaign } from '@dcc/generate-miz'
import { getScenarios } from '../data/get-scenarios'
import { getTheatre } from '../data/get-theatre'

const stateFile = path.join(app.getPath('userData'), 'state.json')
const campaignsDir = path.join(app.getPath('userData'), 'campaigns')
const missionStateFileName = 'dcc_state.json'
console.log('stateFile', stateFile)
console.log('campaignsDir', campaignsDir)

const savedGamesVariants = ['DCS', 'DCS.openbeta', 'DCS.openbeta_server', 'DCS_server']

type AppSettings = {
  missionExportPath?: string
  dcsInstallPath?: string
  enableDcsPersistence?: boolean
}

function getMissionStateSearchPaths(settings?: AppSettings) {
  const paths: string[] = []
  if (settings?.missionExportPath) {
    paths.push(path.join(settings.missionExportPath, missionStateFileName))
  }
  const savedGamesRoot = path.join(app.getPath('home'), 'Saved Games')
  for (const variant of savedGamesVariants) {
    paths.push(path.join(savedGamesRoot, variant, 'Missions', missionStateFileName))
  }
  return paths
}

// State file structure: { activeCampaignId: string | null, settings?: AppSettings }
async function getState() {
  const file = await readFile(stateFile)
  if (file.isErr()) {
    if (file.error instanceof NotFoundError) {
      return {}
    }
    throw new Error((file.error as Error).message)
  }
  const parsedState = parseJson(file.value)
  if (parsedState.isErr()) {
    return {}
  }
  return parsedState.value as {
    activeCampaignId?: string
    settings?: AppSettings
  }
}

async function saveState(state: {
  activeCampaignId?: string
  settings?: AppSettings
}) {
  const current = await getState()
  const result = await writeFile(stateFile, { ...current, ...state })
  if (result.isErr()) {
    throw new Error(result.error.message)
  }
}

async function getActiveCampaignId() {
  const state = await getState()
  return state.activeCampaignId ?? null
}

async function setActiveCampaignId(id: string | null) {
  const state = await getState()
  await saveState({ ...state, activeCampaignId: id ?? undefined })
}

function getCampaignPath(id: string) {
  return path.join(campaignsDir, `${id}.json`)
}

const getActiveCampaign = pub.campaign.getActiveCampaign.handler(async ({ errors }) => {
  const activeCampaignId = await getActiveCampaignId()
  if (!activeCampaignId) {
    return null
  }

  const campaignPath = getCampaignPath(activeCampaignId)
  const file = await readFile(campaignPath)
  if (file.isErr()) {
    if (file.error instanceof NotFoundError) {
      return null
    }
    throw errors.INVALID_APP_STATE({ data: { message: (file.error as Error).message } })
  }
  const parsedState = parseJson(file.value)
  if (parsedState.isErr()) {
    throw errors.INVALID_APP_STATE({ data: { message: parsedState.error.message } })
  }

  const schemaParsedState = neverthrowParse(schemas.campaign.campaign, parsedState.value)
  if (schemaParsedState.isErr()) {
    throw errors.INVALID_APP_STATE({ data: { message: schemaParsedState.error.message } })
  }
  return schemaParsedState.value
})

const saveActiveCampaign = pub.campaign.saveActiveCampaign.handler(async ({ errors, input }) => {
  // Ensure campaigns directory exists
  const dirResult = await ensureDirectory(campaignsDir)
  if (dirResult.isErr()) {
    throw errors.FAILED_TO_WRITE_FILE({
      data: { path: campaignsDir, message: dirResult.error.message }
    })
  }

  const campaignPath = getCampaignPath(input.id)
  const writeFileResult = await writeFile(campaignPath, input)
  return writeFileResult.match(
    () => undefined,
    (error) => {
      throw errors.FAILED_TO_WRITE_FILE({ data: { path: campaignPath, message: error.message } })
    }
  )
})

const listCampaigns = pub.campaign.listCampaigns.handler(async ({ errors }) => {
  // Ensure campaigns directory exists
  const dirResult = await ensureDirectory(campaignsDir)
  if (dirResult.isErr()) {
    throw errors.FAILED_TO_READ_DIRECTORY({
      data: { path: campaignsDir, message: dirResult.error.message }
    })
  }

  const filesResult = await readDirectory(campaignsDir)
  if (filesResult.isErr()) {
    if (filesResult.error instanceof NotFoundError) {
      return []
    }
    throw errors.FAILED_TO_READ_DIRECTORY({
      data: { path: campaignsDir, message: (filesResult.error as Error).message }
    })
  }

  const jsonFiles = filesResult.value.filter((file) => file.endsWith('.json'))
  const campaigns = await Promise.all(
    jsonFiles.map(async (file) => {
      const campaignPath = path.join(campaignsDir, file)
      const fileResult = await readFile(campaignPath)
      if (fileResult.isErr()) {
        return null
      }
      const parsedResult = parseJson(fileResult.value)
      if (parsedResult.isErr()) {
        return null
      }
      const campaign = parsedResult.value as {
        id: string
        name: string
        createdAt: string | Date
      }
      return {
        id: campaign.id,
        name: campaign.name,
        createdAt: new Date(campaign.createdAt)
      }
    })
  )

  return campaigns.filter((c) => c !== null)
})

const openCampaign = pub.campaign.openCampaign.handler(async ({ errors, input }) => {
  const campaignPath = getCampaignPath(input.id)
  const file = await readFile(campaignPath)
  if (file.isErr()) {
    throw errors.NOT_FOUND({
      data: { message: `Campaign not found: ${input.id}`, path: campaignPath }
    })
  }
  const parsedState = parseJson(file.value)
  if (parsedState.isErr()) {
    throw errors.INVALID_APP_STATE({ data: { message: parsedState.error.message } })
  }

  const schemaParsedState = neverthrowParse(schemas.campaign.campaign, parsedState.value)
  if (schemaParsedState.isErr()) {
    throw errors.INVALID_APP_STATE({ data: { message: schemaParsedState.error.message } })
  }

  // Set this campaign as active
  await setActiveCampaignId(input.id)

  return schemaParsedState.value
})

const deleteCampaign = pub.campaign.deleteCampaign.handler(async ({ errors, input }) => {
  const campaignPath = getCampaignPath(input.id)
  const result = await deleteFile(campaignPath)
  if (result.isErr()) {
    if (result.error instanceof NotFoundError) {
      return
    }
    throw errors.FAILED_TO_DELETE_FILE({
      data: { path: campaignPath, message: (result.error as Error).message }
    })
  }
})

const getSettings = pub.campaign.getSettings.handler(async () => {
  const state = await getState()
  return state.settings ?? {}
})

const saveSettings = pub.campaign.saveSettings.handler(async ({ input }) => {
  const state = await getState()
  await saveState({ ...state, settings: input })
})

export const generateMiz = pub.campaign.generateMiz.handler(async ({ input, errors }) => {
  const state = await getState()
  const downloadPath = state.settings?.missionExportPath ?? app.getPath('downloads')
  const mizPath = path.join(downloadPath, 'dcc_mission.miz')
  const scenarios = getScenarios()
  const scenario = scenarios.find((s) => s.id === input.scenarioId)
  if (scenario == null) {
    throw errors.NOT_FOUND({ data: { message: 'Scenario not found', path: 'scenarioId' } })
  }
  const theatre = getTheatre(scenario.theatreName)
  if (theatre == null) {
    throw errors.NOT_FOUND({ data: { message: 'Theatre not found', path: scenario.theatreName } })
  }
  const result = generateMizFromCampaign(input, theatre, mizPath)
  if (result.isErr()) {
    throw errors.FAILED_TO_WRITE_FILE({ data: { path: mizPath, message: result.error.message } })
  }
  return undefined
})

export const loadMissionState = pub.campaign.loadMissionState.handler(async ({ errors }) => {
  const state = await getState()
  const searchPaths = getMissionStateSearchPaths(state.settings)

  let filePath: string | null = null
  let fileContents: string | null = null

  for (const candidate of searchPaths) {
    const file = await readFile(candidate)
    if (file.isOk()) {
      filePath = candidate
      fileContents = file.value
      break
    }
    if (file.isErr() && !(file.error instanceof NotFoundError)) {
      throw errors.FAILED_TO_READ_FILE({
        data: { path: candidate, message: (file.error as Error).message }
      })
    }
  }

  if (!filePath || fileContents == null) {
    const fallbackPath = searchPaths[0] ?? missionStateFileName
    throw errors.FAILED_TO_READ_FILE({
      data: { path: fallbackPath, message: 'dcc_state.json not found in known locations.' }
    })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(fileContents)
  } catch (error) {
    throw errors.INVALID_STATE_FILE({
      data: { message: (error as Error).message }
    })
  }

  const schemaParsedState = neverthrowParse(schemas.missionState, parsed)
  if (schemaParsedState.isErr()) {
    throw errors.INVALID_STATE_FILE({ data: { message: schemaParsedState.error.message } })
  }

  return schemaParsedState.value
})

export const campaign = {
  getActiveCampaign,
  createCampaign,
  saveActiveCampaign,
  generateMiz,
  loadMissionState,
  listCampaigns,
  openCampaign,
  deleteCampaign,
  getSettings,
  saveSettings
}
