import { describe, expect, test } from 'vitest'

import { tryDcsPositionToLngLat } from './dcs-coordinates'

describe('tryDcsPositionToLngLat', () => {
  test('converts positions inside the theatre coordinate grid', () => {
    expect(tryDcsPositionToLngLat('SouthAtlantic', 87_610, 184_267)).toEqual({
      lat: expect.any(Number),
      lng: expect.any(Number)
    })
  })

  test('returns undefined for positions outside the theatre coordinate grid', () => {
    expect(tryDcsPositionToLngLat('SouthAtlantic', 87_402, 206_382)).toBeUndefined()
  })
})
