import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

type ProviderConfig = {
  aiProvider?: 'openai' | 'anthropic' | 'openrouter'
  aiApiKey?: string
  aiModel?: string
}

export function createModel(config: ProviderConfig): LanguageModel {
  if (!config.aiApiKey) {
    throw new Error('AI API key is missing. Configure it in Settings.')
  }

  if (config.aiProvider === 'anthropic') {
    const anthropic = createAnthropic({ apiKey: config.aiApiKey })
    return anthropic(config.aiModel || 'claude-sonnet-4-6')
  }

  if (config.aiProvider === 'openrouter') {
    const openrouter = createOpenAI({
      apiKey: config.aiApiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      compatibility: 'compatible'
    })
    return openrouter.chat(config.aiModel || 'anthropic/claude-sonnet-4')
  }

  const openai = createOpenAI({ apiKey: config.aiApiKey })
  return openai(config.aiModel || 'gpt-5-mini')
}
