import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export type CampaignEra = z.infer<typeof schemas.era>

const MS_PER_DAY = 24 * 60 * 60 * 1000
const MORNING_START_HOUR_UTC = 8
const MORNING_END_HOUR_UTC = 10

export const eraDateRanges: Record<CampaignEra, { start: Date; end: Date }> = {
  WW2: {
    start: new Date('1944-01-01T00:00:00Z'),
    end: new Date('1945-12-31T00:00:00Z')
  },
  Korea: {
    start: new Date('1950-06-25T00:00:00Z'),
    end: new Date('1953-07-27T00:00:00Z')
  },
  Vietnam: {
    start: new Date('1954-01-01T00:00:00Z'),
    end: new Date('1964-12-31T00:00:00Z')
  },
  'Late CW': {
    start: new Date('1965-01-01T00:00:00Z'),
    end: new Date('1989-12-31T00:00:00Z')
  },
  Modern: {
    start: new Date('1990-01-01T00:00:00Z'),
    end: new Date('2026-12-31T00:00:00Z')
  }
}

export function randomDateForEra(era: CampaignEra, random = Math.random) {
  const range = eraDateRanges[era]
  const startDayMs = Date.UTC(
    range.start.getUTCFullYear(),
    range.start.getUTCMonth(),
    range.start.getUTCDate()
  )
  const endDayMs = Date.UTC(
    range.end.getUTCFullYear(),
    range.end.getUTCMonth(),
    range.end.getUTCDate()
  )
  const dayCount = Math.floor((endDayMs - startDayMs) / MS_PER_DAY) + 1
  const dayMs = startDayMs + Math.floor(random() * dayCount) * MS_PER_DAY
  const morningWindowMs = (MORNING_END_HOUR_UTC - MORNING_START_HOUR_UTC) * 60 * 60 * 1000
  const timeMs = MORNING_START_HOUR_UTC * 60 * 60 * 1000 + Math.floor(random() * morningWindowMs)

  return new Date(dayMs + timeMs)
}
