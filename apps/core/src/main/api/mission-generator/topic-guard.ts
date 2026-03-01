import { schemas } from '@dcc/contracts'
import * as z from 'zod'

type ChatMessage = z.infer<typeof schemas.missionGenerator.chatMessage>

const missionKeywords = [
  'mission',
  'briefing',
  'dcs',
  'theatre',
  'scenario',
  'sortie',
  'objective',
  'target',
  'coalition',
  'faction',
  'aircraft',
  'flight',
  'package',
  'airbase',
  'airdrome',
  'waypoint',
  'takeoff',
  'landing',
  'ingress',
  'egress',
  'rtb',
  'tot',
  'sam',
  'cap',
  'cas',
  'sead',
  'dead',
  'awacs',
  'tanker',
  'escort',
  'threat',
  'loadout'
]

const explicitOffTopicKeywords = [
  'recipe',
  'cook',
  'poem',
  'story',
  'song',
  'movie',
  'tv show',
  'politics',
  'election',
  'stock',
  'crypto',
  'bitcoin',
  'homework',
  'essay',
  'translate',
  'joke',
  'horoscope'
]

function normalize(text: string) {
  return text.toLowerCase()
}

function includesAny(text: string, keywords: readonly string[]) {
  return keywords.some((keyword) => text.includes(keyword))
}

function looksLikeDcsUnit(text: string) {
  return /\b(f-\d+|fa-\d+|a-\d+|av-8|mig-\d+|su-\d+|ka-\d+|uh-\d+|mi-\d+|sa-\d+)\b/i.test(text)
}

function isMissionRelated(text: string) {
  const normalized = normalize(text)
  return (
    includesAny(normalized, missionKeywords) ||
    looksLikeDcsUnit(normalized) ||
    /\b(cap|cas|sead|dead|awacs|tot|rtb)\b/i.test(normalized)
  )
}

export function isMissionChatAllowed(messages: ChatMessage[]) {
  const userMessages = messages.filter((message) => message.role === 'user')
  const latestUserMessage = userMessages[userMessages.length - 1]

  if (!latestUserMessage) {
    return true
  }

  const latestText = normalize(latestUserMessage.content.trim())
  if (latestText.length === 0) {
    return false
  }

  if (isMissionRelated(latestText)) {
    return true
  }

  if (includesAny(latestText, explicitOffTopicKeywords)) {
    return false
  }

  const hasPriorMissionContext = userMessages
    .slice(0, -1)
    .some((message) => isMissionRelated(message.content))

  // Allow concise follow-up messages when mission context already exists.
  if (hasPriorMissionContext && latestText.length <= 120) {
    return true
  }

  return false
}

export const MISSION_TOPIC_REJECTION_MESSAGE =
  'Only mission-related chat is allowed. Please ask about DCS mission planning or generation.'
