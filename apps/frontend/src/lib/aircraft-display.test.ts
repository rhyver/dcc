import { describe, expect, test } from 'vitest'

import { getTaskAircraftTypeOptions } from './aircraft-display'

describe('getTaskAircraftTypeOptions', () => {
  test('limits options to task-compatible aircraft in the supplied faction roster', () => {
    expect(getTaskAircraftTypeOptions('CAP', ['A-10C_2', 'F-16C_50'])).toEqual(['F-16C_50'])
  })

  test('returns all compatible controllable aircraft when no faction roster is supplied', () => {
    const options = getTaskAircraftTypeOptions('CAP')

    expect(options).toContain('F-16C_50')
    expect(options.length).toBeGreaterThan(1)
  })
})
