import { scenarios } from '@dcc/data'
import { describe, expect, test } from 'vitest'

import { createNavalGroupMapItems } from './naval-map-items'

describe('createNavalGroupMapItems', () => {
  test('converts every configured Falklands fleet position', () => {
    const scenario = scenarios.find((candidate) => candidate.id === 'falklands-1982')
    expect(scenario).toBeDefined()

    const playerItems = createNavalGroupMapItems(
      scenario?.navalGroups?.player ?? [],
      'player',
      'SouthAtlantic'
    )
    const opponentItems = createNavalGroupMapItems(
      scenario?.navalGroups?.opponent ?? [],
      'opponent',
      'SouthAtlantic'
    )

    expect(playerItems).not.toHaveLength(0)
    expect(opponentItems).toHaveLength(1)
    expect(opponentItems[0]?.position.lat).toBeCloseTo(-52.66437, 3)
  })

  test('creates a visible marker with persisted fleet state', () => {
    const [item] = createNavalGroupMapItems(
      [
        {
          id: 'uk-carrier-group',
          name: 'UK Carrier Group',
          role: 'carrier',
          unitTypes: ['hms_invincible', 'hms_invincible'],
          units: [
            {
              id: 'invincible',
              type: 'hms_invincible',
              damage: 0,
              ammunition: 1,
              fuel: 1,
              state: 'operational'
            },
            {
              id: 'hermes',
              type: 'hms_invincible',
              damage: 1,
              ammunition: 0,
              fuel: 0,
              state: 'sunk'
            }
          ],
          position: { x: 104_408, y: 133_773 },
          heading: Math.PI,
          damage: 0.5,
          fuel: 0.75,
          ammunition: 0.5,
          cargo: 0,
          state: 'damaged'
        }
      ],
      'player',
      'SouthAtlantic'
    )

    expect(item).toMatchObject({
      id: 'uk-carrier-group',
      name: 'UK Carrier Group',
      type: 'Naval Group',
      coalition: 'player',
      role: 'carrier',
      state: 'damaged',
      unitCount: 2,
      operationalUnitCount: 1
    })
    expect(item?.position.lng).toBeTypeOf('number')
    expect(item?.position.lat).toBeTypeOf('number')
  })

  test('does not render a sunk group', () => {
    const items = createNavalGroupMapItems(
      [
        {
          id: 'arg-surface-group',
          name: 'Argentine Surface Group',
          role: 'surface-combatant',
          unitTypes: ['ara_vdm'],
          position: { x: 10_000, y: -150_000 },
          heading: 0,
          damage: 1,
          fuel: 0,
          ammunition: 0,
          cargo: 0,
          state: 'sunk'
        }
      ],
      'opponent',
      'SouthAtlantic'
    )

    expect(items).toEqual([])
  })

  test('does not crash the campaign map for an invalid legacy position', () => {
    const scenario = scenarios.find((candidate) => candidate.id === 'falklands-1982')
    const carrier = scenario?.navalGroups?.player.find((group) => group.role === 'carrier')
    expect(carrier).toBeDefined()

    expect(
      createNavalGroupMapItems(
        carrier ? [{ ...carrier, position: { x: 87_402, y: 206_382 } }] : [],
        'player',
        'SouthAtlantic'
      )
    ).toEqual([])
  })
})
