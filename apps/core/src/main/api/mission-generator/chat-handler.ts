import type { BrowserWindow, IpcMain } from 'electron'
import { streamText } from 'ai'
import { schemas } from '@dcc/contracts'
import path from 'path'
import * as z from 'zod'
import { app } from 'electron'

import { parseJson, readFile } from '../../utils'
import { createModel } from './ai-provider'
import { createMissionGeneratorSystemPrompt } from './system-prompt'
import { isMissionChatAllowed, MISSION_TOPIC_REJECTION_MESSAGE } from './topic-guard'
import {
  CHAT_REQUEST_CHANNEL,
  CHAT_STREAM_CHANNEL,
  CHAT_STREAM_END_CHANNEL,
  CHAT_STREAM_ERROR_CHANNEL
} from '../../../shared/mission-generator-channels'

type AppSettings = {
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

export function registerMissionGeneratorChatHandlers(
  ipcMain: IpcMain,
  getWindow: () => BrowserWindow | null
) {
  ipcMain.on(CHAT_REQUEST_CHANNEL, async (_event, rawMessages) => {
    const window = getWindow()
    if (!window) {
      return
    }

    const parsed = z.array(schemas.missionGenerator.chatMessage).safeParse(rawMessages)
    if (!parsed.success) {
      window.webContents.send(CHAT_STREAM_ERROR_CHANNEL, 'Invalid chat message payload.')
      return
    }

    if (!isMissionChatAllowed(parsed.data)) {
      window.webContents.send(CHAT_STREAM_ERROR_CHANNEL, MISSION_TOPIC_REJECTION_MESSAGE)
      return
    }

    try {
      const settings = await getSettings()
      const model = createModel(settings)
      const stream = streamText({
        model,
        system: createMissionGeneratorSystemPrompt(),
        messages: parsed.data.map((message) => ({
          role: message.role,
          content: message.content
        }))
      })

      for await (const chunk of stream.textStream) {
        window.webContents.send(CHAT_STREAM_CHANNEL, chunk)
      }

      window.webContents.send(CHAT_STREAM_END_CHANNEL)
    } catch (error) {
      window.webContents.send(
        CHAT_STREAM_ERROR_CHANNEL,
        error instanceof Error ? error.message : 'Unknown AI streaming error'
      )
    }
  })
}
