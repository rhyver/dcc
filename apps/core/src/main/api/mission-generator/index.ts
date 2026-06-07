import { app } from 'electron'
import { buildCampaignFromPlan } from '@dcc/frontend/mission-generator'
import { generateMizFromCampaign } from '@dcc/generate-miz'
import { schemas } from '@dcc/contracts'
import { existsSync, promises as fs } from 'fs'
import path from 'path'
import * as z from 'zod'

import { pub } from '../orpc'
import {
  NotFoundError,
  deleteFile,
  ensureDirectory,
  parseJson,
  readDirectory,
  readFile,
  writeFile
} from '../../utils'
import { getScenarios } from '../data/get-scenarios'
import { getTheatre } from '../data/get-theatre'
import { createModel } from './ai-provider'
import { intakeMissionPlan } from './mission-plan-intake'
import { isMissionChatAllowed, MISSION_TOPIC_REJECTION_MESSAGE } from './topic-guard'
import { missionBriefingsDir, stateFile } from '../../app-data'

type AppSettings = {
  missionExportPath?: string
  aiProvider?: 'openai' | 'anthropic' | 'openrouter'
  aiApiKey?: string
  aiModel?: string
}

const briefingsDir = missionBriefingsDir
const savedGamesVariants = ['DCS', 'DCS.openbeta', 'DCS.openbeta_server', 'DCS_server']
type MissionPlan = z.infer<typeof schemas.missionGenerator.missionPlan>
type SavedBriefing = z.infer<typeof schemas.missionGenerator.savedBriefing>

async function getSettings(): Promise<AppSettings> {
  const file = await readFile(stateFile)
  if (file.isErr()) {
    return {}
  }
  const parsedState = parseJson(file.value)
  if (parsedState.isErr()) {
    return {}
  }
  const state = parsedState.value as { settings?: AppSettings }
  return state.settings ?? {}
}

function getDefaultMissionExportDirectory() {
  const savedGamesRoot = path.join(app.getPath('home'), 'Saved Games')
  const candidates = savedGamesVariants.map((variant) =>
    path.join(savedGamesRoot, variant, 'Missions')
  )

  const existing = candidates.find((candidate) => existsSync(candidate))
  return existing ?? app.getPath('downloads')
}

function resolveMissionExportDirectory(missionExportPath?: string) {
  const configuredPath = missionExportPath?.trim()
  const defaultDirectory = getDefaultMissionExportDirectory()

  if (!configuredPath) {
    return defaultDirectory
  }

  if (path.isAbsolute(configuredPath)) {
    return configuredPath
  }

  // Never resolve against app cwd; treat relative settings as subfolders of the mission export default.
  return path.join(defaultDirectory, configuredPath)
}

function createSanitizedName(value: string) {
  return value
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function deriveBriefingName(input: { name?: string; missionPlan?: MissionPlan; briefing: string }) {
  const explicitName = input.name?.trim()
  if (explicitName) {
    return createSanitizedName(explicitName).slice(0, 120) || 'Saved Briefing'
  }

  if (input.missionPlan?.title) {
    const fromPlan = createSanitizedName(input.missionPlan.title)
    if (fromPlan) {
      return fromPlan.slice(0, 120)
    }
  }

  const firstLine =
    input.briefing
      .split(/\r?\n/)
      .find((line) => line.trim().length > 0)
      ?.trim() ?? ''
  const fromBriefing = createSanitizedName(firstLine)
  return (fromBriefing || 'Saved Briefing').slice(0, 120)
}

function getBriefingPath(id: string) {
  return path.join(briefingsDir, `${id}.json`)
}

function pickBriefingSummary(briefing: SavedBriefing) {
  return {
    id: briefing.id,
    name: briefing.name,
    createdAt: briefing.createdAt,
    updatedAt: briefing.updatedAt
  }
}

async function readSavedBriefingFromPath(filePath: string): Promise<SavedBriefing | null> {
  const fileResult = await readFile(filePath)
  if (fileResult.isErr()) {
    return null
  }

  const parsed = parseJson(fileResult.value)
  if (parsed.isErr()) {
    return null
  }

  const schemaParsed = schemas.missionGenerator.savedBriefing.safeParse(parsed.value)
  return schemaParsed.success ? schemaParsed.data : null
}

export const saveBriefing = pub.missionGenerator.saveBriefing.handler(async ({ input, errors }) => {
  const ensureResult = await ensureDirectory(briefingsDir)
  if (ensureResult.isErr()) {
    throw errors.FAILED_TO_WRITE_FILE({
      data: { path: briefingsDir, message: ensureResult.error.message }
    })
  }

  const now = new Date()
  const id = crypto.randomUUID()
  const briefing: SavedBriefing = {
    id,
    name: deriveBriefingName(input),
    briefing: input.briefing.trim(),
    messages: input.messages,
    ...(input.missionPlan ? { missionPlan: input.missionPlan } : {}),
    createdAt: now,
    updatedAt: now
  }

  const filePath = getBriefingPath(id)
  const writeResult = await writeFile(filePath, briefing)
  if (writeResult.isErr()) {
    throw errors.FAILED_TO_WRITE_FILE({
      data: { path: filePath, message: writeResult.error.message }
    })
  }

  return pickBriefingSummary(briefing)
})

export const listBriefings = pub.missionGenerator.listBriefings.handler(async () => {
  const ensureResult = await ensureDirectory(briefingsDir)
  if (ensureResult.isErr()) {
    return []
  }

  const listResult = await readDirectory(briefingsDir)
  if (listResult.isErr()) {
    return []
  }

  const files = listResult.value.filter((entry) => entry.endsWith('.json'))
  const loaded = await Promise.all(
    files.map(async (entry) => readSavedBriefingFromPath(path.join(briefingsDir, entry)))
  )

  return loaded
    .filter((entry): entry is SavedBriefing => entry != null)
    .map((entry) => pickBriefingSummary(entry))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
})

export const getBriefing = pub.missionGenerator.getBriefing.handler(async ({ input, errors }) => {
  const filePath = getBriefingPath(input.id)
  const briefing = await readSavedBriefingFromPath(filePath)
  if (briefing == null) {
    throw errors.NOT_FOUND({ data: { message: 'Briefing not found', path: filePath } })
  }

  return briefing
})

export const deleteBriefing = pub.missionGenerator.deleteBriefing.handler(
  async ({ input, errors }) => {
    const filePath = getBriefingPath(input.id)
    const deleteResult = await deleteFile(filePath)
    if (deleteResult.isErr()) {
      if (!(deleteResult.error instanceof NotFoundError)) {
        throw errors.FAILED_TO_DELETE_FILE({
          data: { path: filePath, message: 'Failed to delete briefing file.' }
        })
      }
    }
  }
)

export const generateMission = pub.missionGenerator.generateMission.handler(
  async ({ input, errors }) => {
    if (!isMissionChatAllowed(input.messages)) {
      throw errors.INVALID_APP_STATE({
        data: { message: MISSION_TOPIC_REJECTION_MESSAGE }
      })
    }

    const settings = await getSettings()
    const model = createModel(settings)

    const missionPlan = await intakeMissionPlan({
      missionPlan: input.missionPlan,
      messages: input.messages,
      model
    })

    let campaign
    try {
      campaign = buildCampaignFromPlan(missionPlan)
    } catch (error) {
      throw errors.INVALID_APP_STATE({
        data: { message: error instanceof Error ? error.message : 'Failed to build campaign' }
      })
    }

    const scenario = getScenarios().find((item) => item.id === campaign.scenarioId)
    if (scenario == null) {
      throw errors.NOT_FOUND({ data: { message: 'Scenario not found', path: campaign.scenarioId } })
    }

    const theatre = getTheatre(scenario.theatreName)
    if (theatre == null) {
      throw errors.NOT_FOUND({ data: { message: 'Theatre not found', path: scenario.theatreName } })
    }

    const downloadPath = resolveMissionExportDirectory(settings.missionExportPath)
    const exportDirectoryResult = await ensureDirectory(downloadPath)
    if (exportDirectoryResult.isErr()) {
      throw errors.FAILED_TO_WRITE_FILE({
        data: { path: downloadPath, message: exportDirectoryResult.error.message }
      })
    }

    const sanitizedTitle = missionPlan.title.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40)
    const fileBase = `ai_mission_${sanitizedTitle || 'mission'}_${Date.now()}`
    const missionPlanPath = path.join(downloadPath, `${fileBase}.mission-plan.json`)
    const campaignPath = path.join(downloadPath, `${fileBase}.campaign.json`)
    const mizPath = path.join(downloadPath, `${fileBase}.miz`)

    try {
      await fs.writeFile(missionPlanPath, JSON.stringify(missionPlan, null, 2), 'utf8')
      await fs.writeFile(campaignPath, JSON.stringify(campaign, null, 2), 'utf8')
    } catch (writeError) {
      throw errors.FAILED_TO_WRITE_FILE({
        data: {
          path: downloadPath,
          message:
            writeError instanceof Error ? writeError.message : 'Failed to write mission JSON.'
        }
      })
    }

    const result = await generateMizFromCampaign(campaign, theatre, mizPath)
    if (result.isErr()) {
      throw errors.FAILED_TO_WRITE_FILE({ data: { path: mizPath, message: result.error.message } })
    }

    return {
      path: mizPath,
      missionPlan,
      missionPlanPath,
      campaignPath
    }
  }
)

export const missionGenerator = {
  generateMission,
  saveBriefing,
  listBriefings,
  getBriefing,
  deleteBriefing
}
