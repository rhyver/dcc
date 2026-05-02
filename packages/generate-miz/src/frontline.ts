import { schemas } from '@dcc/contracts'
import * as turf from '@turf/turf'
import * as z from 'zod'

export type FrontlineSegment = {
  start: { x: number; y: number }
  end: { x: number; y: number }
}

export function getFrontlineSegments(
  campaign: z.infer<typeof schemas.campaign.campaign>,
  theatre: z.infer<typeof schemas.theatre>
): FrontlineSegment[] {
  const objectivesByName = new Map(
    theatre.objectives.map((objective) => [objective.name, objective])
  )
  const playerObjectives = (campaign.coalitions.player.objectiveIds ?? [])
    .map((objectiveId) => objectivesByName.get(objectiveId)?.position)
    .filter((position) => position != null)
  const opponentObjectives = (campaign.coalitions.opponent.objectiveIds ?? [])
    .map((objectiveId) => objectivesByName.get(objectiveId)?.position)
    .filter((position) => position != null)

  if (playerObjectives.length === 0 || opponentObjectives.length === 0) {
    return []
  }

  const points = [
    ...playerObjectives.map((position) =>
      turf.point([position.x, position.y], { coalition: 'player' })
    ),
    ...opponentObjectives.map((position) =>
      turf.point([position.x, position.y], { coalition: 'opponent' })
    )
  ]
  const collection = turf.featureCollection(points)
  const bbox = turf.bbox(collection)
  const expandedBbox = [bbox[0] - 10000, bbox[1] - 10000, bbox[2] + 10000, bbox[3] + 10000] as [
    number,
    number,
    number,
    number
  ]
  const voronoi = turf.voronoi(collection, { bbox: expandedBbox })
  const playerPolys: GeoJSON.Feature<GeoJSON.Polygon>[] = []
  const opponentPolys: GeoJSON.Feature<GeoJSON.Polygon>[] = []

  turf.featureEach(voronoi, (currentFeature: GeoJSON.Feature<GeoJSON.Polygon> | null) => {
    if (currentFeature?.properties?.coalition === 'player') {
      playerPolys.push(currentFeature)
    } else if (currentFeature?.properties?.coalition === 'opponent') {
      opponentPolys.push(currentFeature)
    }
  })

  if (playerPolys.length === 0 || opponentPolys.length === 0) {
    return []
  }

  const round = (n: number) => Math.round(n * 100) / 100
  const segKey = (a: number[], b: number[]) => {
    const ax = a[0]
    const ay = a[1]
    const bx = b[0]
    const by = b[1]
    if (ax == null || ay == null || bx == null || by == null) return null
    const ka = `${round(ax)},${round(ay)}`
    const kb = `${round(bx)},${round(by)}`
    return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`
  }

  const opponentEdges = new Set<string>()
  for (const poly of opponentPolys) {
    const ring = poly.geometry.coordinates[0]
    if (!ring) continue
    for (let i = 0; i < ring.length - 1; i++) {
      const a = ring[i]
      const b = ring[i + 1]
      if (!a || !b) continue
      const key = segKey(a, b)
      if (key) opponentEdges.add(key)
    }
  }

  const frontlineSegments: FrontlineSegment[] = []
  for (const poly of playerPolys) {
    const ring = poly.geometry.coordinates[0]
    if (!ring) continue
    for (let i = 0; i < ring.length - 1; i++) {
      const a = ring[i]
      const b = ring[i + 1]
      if (!a || !b) continue
      const key = segKey(a, b)
      if (!key || !opponentEdges.has(key)) continue
      const ax = a[0]
      const ay = a[1]
      const bx = b[0]
      const by = b[1]
      if (ax == null || ay == null || bx == null || by == null) continue
      frontlineSegments.push({
        start: { x: ax, y: ay },
        end: { x: bx, y: by }
      })
    }
  }

  return frontlineSegments
}
