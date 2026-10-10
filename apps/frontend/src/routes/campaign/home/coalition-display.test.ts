import { describe, expect, test } from 'vitest'
import { getCoalitionColor, getCoalitionSide } from './coalition-display'
import { getMilSymbolCode, getMilSymbolSvg } from './unit-code'

describe('campaign coalition colors', () => {
  test.each(['blue', 'red'] as const)('uses the selected %s side for player assets', (side) => {
    const opponentSide = side === 'blue' ? 'red' : 'blue'
    expect(getCoalitionSide('player', side)).toBe(side)
    expect(getCoalitionSide('opponent', side)).toBe(opponentSide)
    expect(getCoalitionColor('player', side)).toBe(side === 'red' ? '#ff4d4f' : '#00ddff')
    expect(getCoalitionColor('opponent', side)).toBe(side === 'red' ? '#00ddff' : '#ff4d4f')
  })

  test('keeps legacy campaigns without a selected side blue', () => {
    expect(getCoalitionSide('player')).toBe('blue')
    expect(getCoalitionSide('opponent')).toBe('red')
  })

  test('renders Red Bullet player airbases red and opposing airbases blue', () => {
    const player = {
      id: 'player-Sukhumi-Babushara',
      name: 'Sukhumi-Babushara',
      type: 'Airdrome' as const,
      coalition: 'player' as const,
      position: { lng: 41.12, lat: 42.86 }
    }
    const opponent = {
      ...player,
      id: 'opponent-Kobuleti',
      name: 'Kobuleti',
      coalition: 'opponent' as const
    }
    expect(getMilSymbolSvg(player, 'red')).toContain('fill="#ff4d4f"')
    expect(getMilSymbolSvg(opponent, 'red')).toContain('fill="#00ddff"')
    // Friend/hostile frames continue to indicate the relationship to the player.
    expect(getMilSymbolCode(player)[1]).toBe('F')
    expect(getMilSymbolCode(opponent)[1]).toBe('H')
  })
})
