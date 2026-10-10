import { LLtoLO, LOtoLL, type Types } from '@kilcekru/dcs-coordinates'

export type LngLat = { lat: number; lng: number }

export function tryLngLatToDcsPosition(
  theatre: string,
  lng: number,
  lat: number
): { x: number; y: number } | undefined {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return undefined

  try {
    const result = LLtoLO({ theatre: theatre as Types.Theatre, lat, lng })
    return { x: result.x, y: result.z }
  } catch {
    return undefined
  }
}

/**
 * The coordinate library only covers a bounded survey grid for each DCS theatre.
 * Runtime positions can legitimately fall outside that grid (for example, older
 * South Atlantic saves), so map rendering must treat conversion as fallible.
 */
export function tryDcsPositionToLngLat(theatre: string, x: number, z: number): LngLat | undefined {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return undefined

  try {
    return LOtoLL({ theatre: theatre as Types.Theatre, x, z })
  } catch {
    return undefined
  }
}
