import { app } from 'electron'
import { generateObject } from 'ai'
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
import { getFactions } from '../data/get-factions'
import { getScenarios } from '../data/get-scenarios'
import { getTheatre } from '../data/get-theatre'
import { createModel } from './ai-provider'
import { buildCampaignFromPlan } from './build-campaign-from-plan'
import { createMissionGeneratorSystemPrompt } from './system-prompt'
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
type MissionChatMessage = z.infer<typeof schemas.missionGenerator.chatMessage>
type SavedBriefing = z.infer<typeof schemas.missionGenerator.savedBriefing>
type MissionTask = MissionPlan['playerCoalition']['primaryFlight']['task']

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

function conversationToPrompt(messages: z.infer<typeof schemas.missionGenerator.chatMessage>[]) {
  return messages
    .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
    .join('\n\n')
}

function parseMissionPlan(value: unknown): MissionPlan | null {
  const parsed = schemas.missionGenerator.missionPlan.safeParse(value)
  return parsed.success ? parsed.data : null
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    return null
  }
  return text.slice(start, end + 1)
}

function tryParseMissionPlanFromText(text: string): MissionPlan | null {
  const candidates = [text.trim()]
  const fencedBlocks = text.match(/```(?:json)?\s*([\s\S]*?)```/gi) ?? []
  for (const block of fencedBlocks) {
    candidates.push(
      block
        .replace(/```(?:json)?/gi, '')
        .replace(/```/g, '')
        .trim()
    )
  }

  const embeddedJson = extractFirstJsonObject(text)
  if (embeddedJson) {
    candidates.push(embeddedJson.trim())
  }

  for (const candidate of candidates) {
    if (!candidate) continue
    try {
      const parsedJson = JSON.parse(candidate)
      const parsedPlan = parseMissionPlan(parsedJson)
      if (parsedPlan) {
        return parsedPlan
      }
    } catch {
      // ignore invalid JSON candidates and keep searching
    }
  }

  return null
}

function extractTextFromGenerationError(error: unknown): string | null {
  if (error == null || typeof error !== 'object') {
    return null
  }

  const topLevelText = (error as { text?: unknown }).text
  if (typeof topLevelText === 'string' && topLevelText.trim().length > 0) {
    return topLevelText
  }

  const causeText = (error as { cause?: { text?: unknown } }).cause?.text
  if (typeof causeText === 'string' && causeText.trim().length > 0) {
    return causeText
  }

  return null
}

function detectEra(text: string): MissionPlan['era'] {
  const normalized = text.toLowerCase()
  if (normalized.includes('ww2')) return 'WW2'
  if (normalized.includes('korea')) return 'Korea'
  if (normalized.includes('early cw') || normalized.includes('early cold war')) return 'Early CW'
  if (normalized.includes('late cw') || normalized.includes('late cold war')) return 'Late CW'
  return 'Modern'
}

function detectTask(text: string): MissionPlan['playerCoalition']['primaryFlight']['task'] {
  const normalized = text.toLowerCase()
  if (normalized.includes('sead')) return 'SEAD'
  if (normalized.includes('pinpoint strike')) return 'Pinpoint Strike'
  if (normalized.includes('cas')) return 'CAS'
  if (normalized.includes('escort')) return 'Escort'
  if (normalized.includes('transport')) return 'Transport'
  if (normalized.includes('cap')) return 'CAP'
  return 'Ground Attack'
}

function detectExplicitTaskRequest(text: string): MissionTask | null {
  const normalized = text.toLowerCase()
  if (/\bcas\b|close air support/.test(normalized)) return 'CAS'
  if (/\bsead\b/.test(normalized)) return 'SEAD'
  if (/pinpoint strike|precision strike/.test(normalized)) return 'Pinpoint Strike'
  if (/\bcap\b|combat air patrol/.test(normalized)) return 'CAP'
  if (/escort/.test(normalized)) return 'Escort'
  if (/transport|airlift/.test(normalized)) return 'Transport'
  if (/ground attack/.test(normalized)) return 'Ground Attack'
  return null
}

function detectExplicitAircraftRequest(text: string): string | null {
  const normalized = text.toLowerCase()

  if (/\bah-?64\b|apache/.test(normalized)) {
    return 'AH-64D_BLK_II'
  }

  const knownAircraft = schemas.dcs.aircraftName.options
  const matched = knownAircraft.find((aircraft) => normalized.includes(aircraft.toLowerCase()))
  return matched ?? null
}

function detectExplicitAaaRequest(text: string): string | null {
  const normalized = text.toLowerCase()
  if (normalized.includes('zsu-23-4') || normalized.includes('shilka')) {
    return 'ZSU-23-4 Shilka'
  }
  if (normalized.includes('zu-23')) {
    return 'ZU-23'
  }
  if (normalized.includes('aaa') || normalized.includes('anti-aircraft')) {
    return 'AAA'
  }
  return null
}

function enforceMissionIntentFromConversation(
  missionPlan: MissionPlan,
  messages: MissionChatMessage[]
): MissionPlan {
  const userText = messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join('\n')
  const fullConversationText = messages.map((message) => message.content).join('\n')

  if (userText.trim().length === 0) {
    return missionPlan
  }

  const explicitTask = detectExplicitTaskRequest(userText)
  const explicitAircraft = detectExplicitAircraftRequest(userText)
  const explicitAaaType = detectExplicitAaaRequest(fullConversationText)
  const hasAaaPlacements = missionPlan.opponentCoalition.aaaPlacements.length > 0
  if (!explicitTask && !explicitAircraft && (!explicitAaaType || hasAaaPlacements)) {
    return missionPlan
  }

  const fallbackObjectiveName = missionPlan.objectiveNames[0]
  const derivedAaaPlacements =
    explicitAaaType && !hasAaaPlacements && fallbackObjectiveName
      ? [
          {
            aaaType: explicitAaaType,
            objectiveName: fallbackObjectiveName,
            count: 2
          }
        ]
      : missionPlan.opponentCoalition.aaaPlacements

  return {
    ...missionPlan,
    playerCoalition: {
      ...missionPlan.playerCoalition,
      primaryFlight: {
        ...missionPlan.playerCoalition.primaryFlight,
        ...(explicitTask ? { task: explicitTask } : {}),
        ...(explicitAircraft ? { aircraftType: explicitAircraft } : {})
      }
    },
    opponentCoalition: {
      ...missionPlan.opponentCoalition,
      aaaPlacements: derivedAaaPlacements
    }
  }
}

function extractMissionTitle(text: string): string {
  const matchers = [
    /mission\s+title\s*[:-]\s*([^\r\n*]+)/i,
    /mission\s+plan\s*[:-]\s*([^\r\n*]+)/i,
    /^\s*#*\s*([A-Z0-9][^\r\n]{6,80})$/im
  ]

  for (const matcher of matchers) {
    const match = text.match(matcher)
    const title = match?.[1]?.replace(/\s+/g, ' ').trim()
    if (title) {
      return title.slice(0, 80)
    }
  }

  return 'AI Generated Mission'
}

function detectSupportEnabled(text: string, keyword: string): boolean {
  const normalized = text.toLowerCase()
  const loweredKeyword = keyword.toLowerCase()
  const explicitNo = new RegExp(`${loweredKeyword}\\s*:\\s*(none|no|false|n\\/a)`, 'i')
  const explicitYes = new RegExp(
    `${loweredKeyword}\\s*:\\s*(yes|true|enabled|included|available)`,
    'i'
  )

  if (explicitNo.test(normalized)) return false
  if (explicitYes.test(normalized)) return true

  return false
}

function buildFallbackMissionPlan(messages: MissionChatMessage[], modelText?: string): MissionPlan {
  const conversation = conversationToPrompt(messages)
  const combinedText = [conversation, modelText ?? ''].filter(Boolean).join('\n\n')
  const normalized = combinedText.toLowerCase()

  const scenarios = getScenarios()
  const fallbackScenario = scenarios[0]
  if (!fallbackScenario) {
    throw new Error('No scenario available to build fallback mission plan.')
  }

  const theatreNames = Array.from(new Set(scenarios.map((scenario) => scenario.theatreName)))
  const chosenTheatreName =
    theatreNames.find((name) => normalized.includes(name.toLowerCase())) ??
    fallbackScenario.theatreName

  const theatre = getTheatre(chosenTheatreName) ?? getTheatre(fallbackScenario.theatreName)
  if (theatre == null) {
    throw new Error(`Theatre not found for fallback mission plan: ${chosenTheatreName}`)
  }

  const allAirdromes = Object.keys(theatre.airdromeDetails)
  const playerAirdromes = fallbackScenario.start.player.airdromeNames.filter(
    (name) => theatre.airdromeDetails[name] != null
  )

  const homeAirbase =
    allAirdromes.find((name) => normalized.includes(name.toLowerCase())) ??
    playerAirdromes[0] ??
    allAirdromes[0]

  if (homeAirbase == null) {
    throw new Error('No usable airdrome found for fallback mission plan.')
  }

  const objectives = theatre.objectives.map((objective) => objective.name)
  const matchedObjectives = objectives.filter((name) => normalized.includes(name.toLowerCase()))
  const objectiveNames =
    matchedObjectives.length > 0 ? matchedObjectives.slice(0, 3) : [objectives[0]]

  if (objectiveNames[0] == null) {
    throw new Error('No objective available for fallback mission plan.')
  }

  const factions = getFactions()
  const playerFactionId = 'usa-2004'
  const playerFaction = factions.find((faction) => faction.id === playerFactionId) ?? factions[0]
  if (playerFaction == null) {
    throw new Error('No faction available for fallback mission plan.')
  }

  const aircraftTypesByTask = playerFaction.aircraftTypes as Record<string, string[]>
  const availableAircraft = Object.values(aircraftTypesByTask).flat()
  const detectedAircraft =
    availableAircraft.find((aircraftType) => normalized.includes(aircraftType.toLowerCase())) ??
    aircraftTypesByTask['Ground Attack']?.[0] ??
    aircraftTypesByTask.CAS?.[0] ??
    availableAircraft[0]

  if (detectedAircraft == null) {
    throw new Error('No aircraft available for fallback mission plan.')
  }

  const weatherMatch = combinedText.match(/weather\s*:\s*([^\r\n]+)/i)
  const weatherSummary = weatherMatch?.[1]?.trim()

  const candidatePlan: MissionPlan = {
    title: extractMissionTitle(combinedText),
    theatreName: theatre.name,
    era: detectEra(combinedText),
    ...(weatherSummary ? { weatherSummary } : {}),
    objectiveNames,
    playerCoalition: {
      factionId: playerFaction.id,
      primaryFlight: {
        aircraftType: detectedAircraft,
        task: detectTask(combinedText),
        count: 2,
        homeAirbase
      }
    },
    opponentCoalition: {
      factionId: 'russia-1996',
      capFlights: [],
      samPlacements: [],
      aaaPlacements: []
    },
    friendlySupport: {
      awacs: detectSupportEnabled(combinedText, 'awacs'),
      seadEscort: detectSupportEnabled(combinedText, 'escort'),
      tanker: detectSupportEnabled(combinedText, 'tanker')
    }
  }

  const parsed = schemas.missionGenerator.missionPlan.safeParse(candidatePlan)
  if (!parsed.success) {
    throw new Error(`Fallback mission plan is invalid: ${parsed.error.message}`)
  }

  return parsed.data
}

async function generateMissionPlan(
  model: ReturnType<typeof createModel>,
  messages: MissionChatMessage[]
): Promise<MissionPlan> {
  const conversationPrompt = conversationToPrompt(messages)

  try {
    const generated = await generateObject({
      model,
      schema: schemas.missionGenerator.missionPlan,
      schemaName: 'missionPlan',
      schemaDescription: 'A strict JSON mission plan for DCS mission generation.',
      system: createMissionGeneratorSystemPrompt(),
      prompt: [
        'Generate a valid mission plan from this conversation.',
        'Return JSON only (no markdown, no prose, no code fences).',
        'Use realistic DCS data and ask no follow-up questions.',
        '',
        conversationPrompt
      ].join('\n'),
      experimental_repairText: async ({ text }) => {
        const parsed = tryParseMissionPlanFromText(text)
        if (parsed) {
          return JSON.stringify(parsed)
        }

        const fallback = buildFallbackMissionPlan(messages, text)
        return JSON.stringify(fallback)
      }
    })

    return generated.object
  } catch (error) {
    const generatedText = extractTextFromGenerationError(error)
    if (generatedText) {
      const parsed = tryParseMissionPlanFromText(generatedText)
      if (parsed) {
        return parsed
      }
    }

    return buildFallbackMissionPlan(messages, generatedText ?? undefined)
  }
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

    const generatedMissionPlan =
      input.missionPlan ?? (await generateMissionPlan(model, input.messages))
    const missionPlan = input.missionPlan
      ? generatedMissionPlan
      : enforceMissionIntentFromConversation(generatedMissionPlan, input.messages)

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

    const result = generateMizFromCampaign(campaign, theatre, mizPath)
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
