import { describe, expect, test } from 'vitest'

import { options } from './options'

describe('DCS mission assists', () => {
  test.each([undefined, {}, { campaignParams: {} }, { campaignParams: { dcsCheats: {} } }])(
    'keeps assists off when absent from a campaign: %j',
    (campaign) => {
      expect(options(campaign).difficulty).toMatchObject({
        fuel: false,
        weapons: false,
        immortal: false,
        labels: 0
      })
    }
  )

  test.each([
    ['unlimitedFuel', 'fuel'],
    ['unlimitedWeapons', 'weapons'],
    ['immortal', 'immortal']
  ] as const)('enables only the requested %s assist', (setting, dcsOption) => {
    const difficulty = options({ campaignParams: { dcsCheats: { [setting]: true } } }).difficulty
    expect(difficulty).toMatchObject({
      fuel: dcsOption === 'fuel',
      weapons: dcsOption === 'weapons',
      immortal: dcsOption === 'immortal',
      labels: 0,
      miniHUD: false,
      easyFlight: false
    })
  })

  test.each([
    ['none', 0],
    ['dot', 3],
    ['abbreviated', 2],
    ['full', 1]
  ] as const)('writes %s labels as DCS mode %s', (labels, expected) => {
    expect(options({ campaignParams: { dcsCheats: { labels } } }).difficulty?.labels).toBe(expected)
  })

  test('explicitly disabled assists stay off', () => {
    expect(
      options({
        campaignParams: {
          dcsCheats: {
            unlimitedFuel: false,
            unlimitedWeapons: false,
            immortal: false,
            labels: 'none'
          }
        }
      }).difficulty
    ).toMatchObject({ fuel: false, weapons: false, immortal: false, labels: 0 })
  })
})
