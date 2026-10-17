import { schemas } from '@dcc/contracts'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'

import { ensureSupercarriersForFlightGroups, requiresSupercarrier } from './carrier-operations'

type Campaign = z.infer<typeof schemas.campaign.campaign>

const aircraftDefinitions = [
  { name: 'FA-18C_hornet' as const, carrierCapable: true, isHelicopter: false },
  { name: 'AV8BNA' as const, carrierCapable: true, isHelicopter: false }
]
const findAircraft = (aircraftName: string) =>
  aircraftDefinitions.find((aircraft) => aircraft.name === aircraftName)

function harrierCarrierCampaign(aircraftName: string) {
  return {
    coalitions: {
      player: {
        flightGroups: [
          {
            id: 'cap',
            homeBase: 'uk-carrier-group',
            aircrafts: [{ id: 'cap-1', unitName: 'Colt-1-1', aircraftName }]
          }
        ],
        navalGroups: [
          {
            id: 'uk-carrier-group',
            role: 'carrier',
            state: 'operational',
            unitTypes: ['LHA_Tarawa'],
            units: [
              {
                id: 'uk-carrier-group-ship-1',
                type: 'LHA_Tarawa',
                damage: 0,
                ammunition: 1,
                fuel: 1,
                state: 'operational'
              }
            ]
          }
        ]
      },
      opponent: { flightGroups: [], navalGroups: [] }
    }
  } as unknown as Campaign
}

describe('requiresSupercarrier', () => {
  test('requires a Supercarrier for conventional carrier-capable aircraft', () => {
    expect(
      requiresSupercarrier({
        name: 'FA-18C_hornet',
        carrierCapable: true,
        isHelicopter: false
      })
    ).toBe(true)
  })

  test('keeps Harriers and helicopters compatible with HMS Invincible', () => {
    expect(
      requiresSupercarrier({ name: 'AV8BNA', carrierCapable: true, isHelicopter: false })
    ).toBe(false)
    expect(requiresSupercarrier({ name: 'UH-1H', carrierCapable: true, isHelicopter: true })).toBe(
      false
    )
  })

  test('does not add a carrier for aircraft that are not carrier capable', () => {
    expect(
      requiresSupercarrier({ name: 'F-16C_50', carrierCapable: false, isHelicopter: false })
    ).toBe(false)
  })
})

describe('ensureSupercarriersForFlightGroups', () => {
  test('adds a Supercarrier when a planned flight needs one at a Harrier carrier', () => {
    const campaign = harrierCarrierCampaign('FA-18C_hornet')

    expect(ensureSupercarriersForFlightGroups(campaign, findAircraft)).toBe(true)

    const carrier = campaign.coalitions.player.navalGroups?.[0]
    expect(carrier?.unitTypes).toEqual(['LHA_Tarawa', 'CVN_71'])
    expect(carrier?.units?.map((unit) => unit.type)).toEqual(['LHA_Tarawa', 'CVN_71'])
    expect(ensureSupercarriersForFlightGroups(campaign, findAircraft)).toBe(false)
  })

  test('leaves the Harrier carrier alone for Harrier flights', () => {
    const campaign = harrierCarrierCampaign('AV8BNA')

    expect(ensureSupercarriersForFlightGroups(campaign, findAircraft)).toBe(false)
    expect(campaign.coalitions.player.navalGroups?.[0]?.unitTypes).toEqual(['LHA_Tarawa'])
  })
})
