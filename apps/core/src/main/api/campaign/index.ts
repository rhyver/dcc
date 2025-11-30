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
  ensureDirectory
} from '../../utils'
import { createCampaign } from './create-campaign'
import { generateMizFromCampaign } from '@dcc/generate-miz'
import { getScenarios } from '../data/get-scenarios'
import { getTheatre } from '../data/get-theatre'

const stateFile = path.join(app.getPath('userData'), 'state.json')
const campaignsDir = path.join(app.getPath('userData'), 'campaigns')
console.log('stateFile', stateFile)
console.log('campaignsDir', campaignsDir)

// State file structure: { activeCampaignId: string | null }
async function getActiveCampaignId() {
  const file = await readFile(stateFile)
  if (file.isErr()) {
    if (file.error instanceof NotFoundError) {
      return null
    }
    throw new Error((file.error as Error).message)
  }
  const parsedState = parseJson(file.value)
  if (parsedState.isErr()) {
    return null
  }
  const state = parsedState.value as { activeCampaignId?: string }
  return state.activeCampaignId ?? null
}

async function setActiveCampaignId(id: string | null) {
  const result = await writeFile(stateFile, { activeCampaignId: id })
  if (result.isErr()) {
    throw new Error(result.error.message)
  }
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

export const generateMiz = pub.campaign.generateMiz.handler(async ({ input, errors }) => {
  const mizPath = path.join(app.getPath('downloads'), 'dcc_mission.miz')
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

export const campaign = {
  getActiveCampaign,
  createCampaign,
  saveActiveCampaign,
  generateMiz,
  listCampaigns,
  openCampaign
}
