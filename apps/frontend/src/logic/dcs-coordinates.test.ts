import { describe, expect, test } from 'vitest'

import { tryDcsPositionToLngLat, tryLngLatToDcsPosition } from './dcs-coordinates'

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

describe('tryLngLatToDcsPosition', () => {
  test('round-trips library theatres', () => {
    const lngLat = tryDcsPositionToLngLat('Caucasus', -281_000, 647_000)
    expect(lngLat).toBeDefined()
    const back = tryLngLatToDcsPosition('Caucasus', lngLat!.lng, lngLat!.lat)
    expect(Math.abs((back?.x ?? 0) - -281_000)).toBeLessThan(50)
    expect(Math.abs((back?.y ?? 0) - 647_000)).toBeLessThan(50)
  })

  test('returns undefined for non-finite input', () => {
    expect(tryLngLatToDcsPosition('Caucasus', Number.NaN, 42)).toBeUndefined()
  })
})
