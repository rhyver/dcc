import { app } from 'electron'
import { generateObject } from 'ai'
import { generateMizFromCampaign } from '@dcc/generate-miz'
import { schemas } from '@dcc/contracts'
import path from 'path'
import * as z from 'zod'

import { pub } from '../orpc'
import { parseJson, readFile } from '../../utils'
import { getScenarios } from '../data/get-scenarios'
import { getTheatre } from '../data/get-theatre'
import { createModel } from './ai-provider'
import { buildCampaignFromPlan } from './build-campaign-from-plan'
import { createMissionGeneratorSystemPrompt } from './system-prompt'
import { isMissionChatAllowed, MISSION_TOPIC_REJECTION_MESSAGE } from './topic-guard'

type AppSettings = {
  missionExportPath?: string
  aiProvider?: 'openai' | 'anthropic' | 'openrouter'
  aiApiKey?: string
  aiModel?: string
}

const stateFile = path.join(app.getPath('userData'), 'state.json')

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

function conversationToPrompt(messages: z.infer<typeof schemas.missionGenerator.chatMessage>[]) {
  return messages
    .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
    .join('\n\n')
}

export const generateMission = pub.missionGenerator.generateMission.handler(
  async ({ input, errors }) => {
    if (!isMissionChatAllowed(input.messages)) {
      throw errors.INVALID_APP_STATE({
        data: { message: MISSION_TOPIC_REJECTION_MESSAGE }
      })
    }

    const settings = await getSettings()
    const model = createModel(settings)

    const missionPlan =
      input.missionPlan ??
      (
        await generateObject({
          model,
          schema: schemas.missionGenerator.missionPlan,
          system: createMissionGeneratorSystemPrompt(),
          prompt: [
            'Generate a valid mission plan from this conversation.',
            'Use realistic DCS data and ask no follow-up questions.',
            '',
            conversationToPrompt(input.messages)
          ].join('\n')
        })
      ).object

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

    const downloadPath = settings.missionExportPath ?? app.getPath('downloads')
    const sanitizedTitle = missionPlan.title.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40)
    const mizPath = path.join(downloadPath, `ai_mission_${sanitizedTitle || Date.now()}.miz`)
    const result = generateMizFromCampaign(campaign, theatre, mizPath)
    if (result.isErr()) {
      throw errors.FAILED_TO_WRITE_FILE({ data: { path: mizPath, message: result.error.message } })
    }

    return {
      path: mizPath,
      missionPlan
    }
  }
)

export const missionGenerator = {
  generateMission
}
