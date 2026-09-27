import { describe, expect, test } from 'vitest'
import { schemas } from '@dcc/contracts'
import type * as z from 'zod'

import { buildCampaignFromPlan } from './build-campaign-from-plan'

type MissionPlan = z.infer<typeof schemas.missionGenerator.missionPlan>

function createMissionPlan(overrides: Partial<MissionPlan['playerCoalition']['primaryFlight']>) {
  return {
    title: 'Bomber Pinpoint Strike',
    theatreName: 'Caucasus',
    era: 'Modern',
    objectiveNames: ['Enguri Dam'],
    playerCoalition: {
      factionId: 'usa-2004',
      primaryFlight: {
        aircraftType: 'B-52H',
        task: 'Pinpoint Strike',
        count: 2,
        homeAirbase: 'Kobuleti',
        ...overrides
      }
    },
    opponentCoalition: {
      factionId: 'russia-1996',
      capFlights: [],
      samPlacements: [],
      aaaPlacements: []
    },
    friendlySupport: {
      awacs: false,
      seadEscort: false,
      tanker: false
    }
  } satisfies MissionPlan
}

describe('buildCampaignFromPlan', () => {
  test('keeps mission-generation strategic bombers as Pinpoint Strike at 40000 feet', () => {
    const campaign = buildCampaignFromPlan(createMissionPlan({}))
    const flightGroup = campaign.coalitions.player.flightGroups[0]

    expect(flightGroup?.task).toBe('Pinpoint Strike')
    expect(flightGroup?.aircrafts[0]?.aircraftName).toBe('B-52H')
    expect(
      flightGroup?.flightplan.waypoints
        .filter((waypoint) => ['Ingress', 'Attack', 'Target', 'RTB'].includes(waypoint.name))
        .map((waypoint) => waypoint.altitude)
    ).toEqual([12_192, 12_192, 12_192, 12_192])
  })

  test('leaves normal Pinpoint Strike aircraft at the default mission altitude', () => {
    const campaign = buildCampaignFromPlan(
      createMissionPlan({
        aircraftType: 'F-16C_50'
      })
    )
    const flightGroup = campaign.coalitions.player.flightGroups[0]

    expect(flightGroup?.task).toBe('Pinpoint Strike')
    expect(flightGroup?.aircrafts[0]?.aircraftName).toBe('F-16C_50')
    expect(
      flightGroup?.flightplan.waypoints
        .filter((waypoint) => ['Ingress', 'Attack', 'Target', 'RTB'].includes(waypoint.name))
        .map((waypoint) => waypoint.altitude)
    ).toEqual([5_500, 5_500, 5_500, 3_000])
  })

  test('places a Ground Attack task before its target', () => {
    const campaign = buildCampaignFromPlan(
      createMissionPlan({
        aircraftType: 'A-10C_2',
        task: 'Ground Attack'
      })
    )
    const waypoints = campaign.coalitions.player.flightGroups[0]?.flightplan.waypoints ?? []
    const attack = waypoints.find((waypoint) => waypoint.name === 'Attack')
    const target = waypoints.find((waypoint) => waypoint.name === 'Target')

    expect(attack?.type).toBe('Task')
    expect(target?.type).toBe('Nav')
    expect(attack?.position).not.toEqual(target?.position)
  })
})
