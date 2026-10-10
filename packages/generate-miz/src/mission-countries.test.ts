import { schemas } from '@dcc/contracts'
import { factions } from '@dcc/data'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'

import { configureMissionCountries } from './index'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Mission = z.infer<typeof schemas.dcs.mission>

function createMission(): Mission {
  return {
    coalitions: {
      neutrals: [],
      blue: [2, 80],
      red: [0, 81]
    },
    coalition: {
      neutrals: { country: [] },
      blue: { country: [] },
      red: { country: [] }
    }
  } as unknown as Mission
}

function createCampaign(playerAircraftType: string, client = true): Campaign {
  const createCoalition = (id: string, capAircraftTypes: string[]) => ({
    id,
    aircraftTypes: { CAP: capAircraftTypes },
    flightGroups: [
      {
        task: 'CAP',
        aircrafts: [{ aircraftName: playerAircraftType, client }]
      }
    ]
  })

  return {
    coalitions: {
      player: createCoalition('usa-2004', ['F-16C_50']),
      opponent: {
        ...createCoalition('russia-1996', ['Su-27']),
        flightGroups: []
      }
    }
  } as unknown as Campaign
}

describe('configureMissionCountries', () => {
  test.each([
    ['west-germany-1985', 'east-germany-1985', 'Germany', 6, 'GDR', 78],
    ['east-germany-1985', 'west-germany-1985', 'GDR', 78, 'Germany', 6],
    ['usa-germany-1955', 'russia-germany-1955', 'USA', 2, 'Russia', 0],
    ['usa-germany-1967', 'russia-germany-1967', 'USA', 2, 'Russia', 0]
  ] as const)(
    'assigns mission countries for %s against %s',
    (playerId, opponentId, playerName, playerCountryId, opponentName, opponentCountryId) => {
      const player = factions.find((faction) => faction.id === playerId)!
      const opponent = factions.find((faction) => faction.id === opponentId)!
      const campaign = createCampaign(player.aircraftTypes.CAP[0]!)
      campaign.coalitions.player.id = playerId
      campaign.coalitions.player.aircraftTypes = player.aircraftTypes
      campaign.coalitions.opponent.id = opponentId
      campaign.coalitions.opponent.aircraftTypes = opponent.aircraftTypes
      const mission = createMission()
      configureMissionCountries(mission, campaign)
      expect(mission.coalition.blue.country?.[0]).toMatchObject({
        id: playerCountryId,
        name: playerName
      })
      expect(mission.coalition.red.country?.[0]).toMatchObject({
        id: opponentCountryId,
        name: opponentName
      })
      expect(mission.coalitions.blue).toContain(playerCountryId)
      expect(mission.coalitions.red).toContain(opponentCountryId)
      expect(mission.coalitions.blue).not.toContain(opponentCountryId)
      expect(mission.coalitions.red).not.toContain(playerCountryId)
    }
  )
  test('uses the faction country for a client aircraft in the faction roster', () => {
    const mission = createMission()

    configureMissionCountries(mission, createCampaign('F-16C_50'))

    expect(mission.coalition.blue.country?.[0]).toMatchObject({ id: 2, name: 'USA' })
    expect(mission.coalition.red.country?.[0]).toMatchObject({ id: 0, name: 'Russia' })
  })

  test('uses the joint task force country for a custom client aircraft', () => {
    const mission = createMission()

    configureMissionCountries(mission, createCampaign('Su-27'))

    expect(mission.coalition.blue.country?.[0]).toMatchObject({ id: 80, name: 'CJTF Blue' })
    expect(mission.coalitions.blue.filter((countryId) => countryId === 80)).toHaveLength(1)
    expect(mission.coalition.red.country?.[0]).toMatchObject({ id: 0, name: 'Russia' })
  })

  test('does not treat an unselected AI aircraft as a custom mission aircraft', () => {
    const mission = createMission()

    configureMissionCountries(mission, createCampaign('Su-27', false))

    expect(mission.coalition.blue.country?.[0]).toMatchObject({ id: 2, name: 'USA' })
  })

  test('uses the country stored with a user-created faction', () => {
    const mission = createMission()
    const campaign = createCampaign('F-16C_50')
    campaign.coalitions.player.id = 'custom-task-force'
    campaign.coalitions.player.countryName = 'USA'

    configureMissionCountries(mission, campaign)

    expect(mission.coalition.blue.country?.[0]).toMatchObject({ id: 2, name: 'USA' })
  })
})
