import { describe, expect, test } from 'vitest'
import { aircrafts, factions, scenarios, templates } from '@dcc/data'
import { schemas } from '@dcc/contracts'

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
  test.each([
    ['usa-germany-1955', 'russia-germany-1955', 1955],
    ['usa-germany-1967', 'russia-germany-1967', 1967],
    ['west-germany-1985', 'east-germany-1985', 1985]
  ] as const)('uses the year of the new %s / %s pairing', (player, opponent, year) => {
    expect(getCampaignYearForFactions(factions, player, opponent, 2022)).toBe(year)
  })
  test('uses the newer year from the selected faction pairing', () => {
    expect(getCampaignYearForFactions(factions, 'usa-2004', 'russia-1996', 1982)).toBe(2004)
  })

  test('falls back to the scenario year when neither faction defines a year', () => {
    expect(getCampaignYearForFactions([], 'custom-player', 'custom-opponent', 1982)).toBe(1982)
  })
})

describe('Germany faction catalog', () => {
  test.each([
    'east-germany-1985',
    'west-germany-1985',
    'usa-germany-1955',
    'usa-germany-1967',
    'russia-germany-1955',
    'russia-germany-1967'
  ])('%s has a valid roster and a registered ground-force template', (id) => {
    const matches = factions.filter((faction) => faction.id === id)
    expect(matches).toHaveLength(1)
    const faction = schemas.faction.parse(matches[0])
    const template = schemas.template.parse(
      templates.find((candidate) => candidate.name === faction.templateName)
    )
    expect(faction.playable).toBe(true)
    expect(template.countryName).toBe(faction.countryName)
    const definitions = new Set<string>(Object.values(aircrafts).map((aircraft) => aircraft.name))
    for (const aircraft of Object.values(faction.aircraftTypes).flat()) {
      expect(definitions.has(aircraft), `${id}: missing aircraft ${aircraft}`).toBe(true)
      expect(schemas.dcs.aircraftName.safeParse(aircraft).success).toBe(true)
    }
  })
})
