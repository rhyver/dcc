import { describe, expect, test } from 'vitest'

import { eraDateRanges, randomDateForEra, type CampaignEra } from './campaign-date'

const eras: CampaignEra[] = ['WW2', 'Korea', 'Early CW', 'Late CW', 'Modern']

describe('randomDateForEra', () => {
  test.each(eras)('returns the first day in the %s range when random is 0', (era) => {
    const date = randomDateForEra(era, () => 0)

    expect(date.toISOString()).toBe(
      eraDateRanges[era].start.toISOString().replace('T00:00:00.000Z', 'T08:00:00.000Z')
    )
  })

  test.each(eras)('can return the last day in the %s range', (era) => {
    const range = eraDateRanges[era]
    const dayCount =
      Math.floor((range.end.getTime() - range.start.getTime()) / (24 * 60 * 60 * 1000)) + 1
    const randomForEndDay = (dayCount - 1) / dayCount

    const date = randomDateForEra(era, () => randomForEndDay)

    expect(date.getUTCFullYear()).toBe(range.end.getUTCFullYear())
    expect(date.getUTCMonth()).toBe(range.end.getUTCMonth())
    expect(date.getUTCDate()).toBe(range.end.getUTCDate())
  })

  test.each(eras)('returns dates inside the %s day range', (era) => {
    const date = randomDateForEra(era, () => 0.5)
    const dateDayMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())

    expect(dateDayMs).toBeGreaterThanOrEqual(eraDateRanges[era].start.getTime())
    expect(dateDayMs).toBeLessThanOrEqual(eraDateRanges[era].end.getTime())
  })

  test.each(eras)('sets the %s time between 08:00 and 10:00 UTC', (era) => {
    const date = randomDateForEra(era, () => 0.75)
    const msSinceUtcMidnight =
      date.getUTCHours() * 60 * 60 * 1000 +
      date.getUTCMinutes() * 60 * 1000 +
      date.getUTCSeconds() * 1000 +
      date.getUTCMilliseconds()

    expect(msSinceUtcMidnight).toBeGreaterThanOrEqual(8 * 60 * 60 * 1000)
    expect(msSinceUtcMidnight).toBeLessThan(10 * 60 * 60 * 1000)
  })
})
