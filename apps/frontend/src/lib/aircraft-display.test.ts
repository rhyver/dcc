import { factions } from '@dcc/data'
import { describe, expect, test } from 'vitest'

import { getAircraftDisplayName, getTaskAircraftTypeOptions } from './aircraft-display'

describe('getTaskAircraftTypeOptions', () => {
  test('limits options to task-compatible aircraft in the supplied faction roster', () => {
    expect(getTaskAircraftTypeOptions('CAP', ['A-10C_2', 'F-16C_50'])).toEqual(['F-16C_50'])
  })

  test('returns all compatible controllable aircraft when no faction roster is supplied', () => {
    const options = getTaskAircraftTypeOptions('CAP')

    expect(options).toContain('F-16C_50')
    expect(options.length).toBeGreaterThan(1)
  })

  test.each(['CSAR', 'CAS', 'Ground Attack'] as const)(
    'offers the Kiowa for %s in the modern USA roster',
    (task) => {
      const faction = factions.find(({ id }) => id === 'usa-2004')
      expect(faction).toBeDefined()
      expect(getTaskAircraftTypeOptions(task, faction?.aircraftTypes[task])).toContain('OH58D')
      expect(getAircraftDisplayName('OH58D')).toBe('OH-58D Kiowa Warrior')
    }
  )
})
