import { schemas } from '@dcc/contracts'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'

import { warehouses } from './warehouses'

type Mission = z.infer<typeof schemas.dcs.mission>
type Campaign = z.infer<typeof schemas.campaign.campaign>
type Theatre = z.infer<typeof schemas.theatre>

describe('warehouses', () => {
  test('registers generated static units, including FARPs', () => {
    const mission = {
      coalition: {
        blue: {
          country: [
            {
              id: 2,
              name: 'USA',
              static: {
                group: [
                  {
                    groupId: 700,
                    name: 'Forward FARP',
                    x: 1000,
                    y: 1000,
                    units: [
                      {
                        unitId: 701,
                        name: 'Forward FARP pad',
                        x: 1000,
                        y: 1000,
                        type: 'FARP',
                        alt: 0,
                        heading: 0
                      },
                      {
                        unitId: 702,
                        name: 'Forward FARP ammo',
                        x: 1050,
                        y: 1050,
                        type: 'FARP Ammo Dump Coating',
                        alt: 0,
                        heading: 0
                      }
                    ]
                  }
                ]
              }
            }
          ]
        },
        red: {},
        neutrals: {}
      }
    } as unknown as Mission
    const campaign = {
      coalitions: {
        player: { airdromeNames: [] },
        opponent: { airdromeNames: [] }
      }
    } as unknown as Campaign
    const theatre = { airdromeDetails: {} } as Theatre

    const result = warehouses(theatre, campaign, mission)

    expect(Object.keys(result.warehouses)).toEqual(['701', '702'])
    expect(result.warehouses['701']).toMatchObject({
      coalition: 'NEUTRAL',
      dynamicCargo: true,
      unlimitedAircrafts: true,
      unlimitedFuel: true,
      unlimitedMunitions: true
    })
  })

  test('registers carrier units as coalition airbase warehouses', () => {
    const mission = {
      coalition: {
        blue: {
          country: [
            {
              id: 4,
              name: 'UK',
              ship: {
                group: [
                  {
                    groupId: 800,
                    name: 'NavalGroup-uk-carrier-group',
                    x: 80_000,
                    y: 185_000,
                    units: [
                      {
                        unitId: 801,
                        name: 'NavalUnit-uk-carrier-group-ship-1',
                        x: 80_000,
                        y: 185_000,
                        type: 'hms_invincible',
                        heading: 0
                      }
                    ]
                  }
                ]
              }
            }
          ]
        },
        red: {},
        neutrals: {}
      }
    } as unknown as Mission
    const campaign = {
      coalitions: {
        player: {
          airdromeNames: [],
          navalGroups: [
            {
              id: 'uk-carrier-group',
              role: 'carrier'
            }
          ]
        },
        opponent: { airdromeNames: [], navalGroups: [] }
      }
    } as unknown as Campaign
    const theatre = { airdromeDetails: {} } as Theatre

    const result = warehouses(theatre, campaign, mission)

    expect(result.warehouses['801']).toMatchObject({
      coalition: 'blue',
      dynamicCargo: true,
      unlimitedAircrafts: true,
      unlimitedFuel: true,
      unlimitedMunitions: true
    })
  })
})
