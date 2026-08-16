import { describe, expect, test } from 'vitest'
import { factions, scenarios } from '@dcc/data'

import { getCampaignYearForFactions, getScenarioCampaignDefaults } from './start-campaign-options'

describe('getScenarioCampaignDefaults', () => {
  test('selects the Falklands-era UK and Argentine factions for the Falklands campaign', () => {
    const scenario = scenarios.find((candidate) => candidate.id === 'falklands-1982')

    expect(getScenarioCampaignDefaults(scenario)).toEqual({
      era: 'Late CW',
      playerFactionId: 'uk-1982',
      opponentFactionId: 'argentina-1982-official'
    })
  })

  test('falls back to the scenario era defaults when no scenario factions are specified', () => {
    const scenario = scenarios.find((candidate) => candidate.id === 'red-bullet')

    expect(getScenarioCampaignDefaults(scenario)).toEqual({
      era: 'Modern',
      playerFactionId: 'usa-2004',
      opponentFactionId: 'russia-1996'
    })
  })
})

describe('getCampaignYearForFactions', () => {
  test('uses the newer year from the selected faction pairing', () => {
    expect(getCampaignYearForFactions(factions, 'usa-2004', 'russia-1996', 1982)).toBe(2004)
  })

  test('falls back to the scenario year when neither faction defines a year', () => {
    expect(getCampaignYearForFactions([], 'custom-player', 'custom-opponent', 1982)).toBe(1982)
  })
})
