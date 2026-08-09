import { describe, expect, test } from 'vitest'

import { requiresSupercarrier } from './carrier-operations'

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
