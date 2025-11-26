import { activeStore } from '@/stores/active'
import { useSelector } from '@xstate/store/react'
import { useMemo } from 'react'
import * as z from 'zod'
import { schemas } from '@dcc/contracts'
import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc'
import { LOtoLL } from '@kilcekru/dcs-coordinates'
import * as turf from '@turf/turf'

export type ObjectiveMarker = {
  id: string
  name: string
  coalition: z.infer<typeof schemas.coalition>
  position: {
    lng: number
    lat: number
  }
}

export function useMapItems(): {
  mapItems: z.infer<typeof schemas.MapItem>[]
  objectiveMarkers: ObjectiveMarker[]
  frontline: GeoJSON.FeatureCollection<GeoJSON.LineString> | null
} {
  const playerCoalition = useSelector(activeStore, (state) => state.context.coalitions.player)
  const opponentCoalition = useSelector(activeStore, (state) => state.context.coalitions.opponent)
  const scenarioId = useSelector(activeStore, (state) => state.context.scenarioId)
  const scenarioQuery = useQuery(
    orpc.data.getScenario.queryOptions({
      input: scenarioId
    })
  )
  const theatreQuery = useQuery(
    orpc.data.getTheatre.queryOptions({
      input: scenarioQuery.data?.theatreName ?? '',
      enabled: scenarioQuery.data != null
    })
  )
  const theatre = theatreQuery.data

  return useMemo(() => {
    if (theatre == null) {
      return {
        mapItems: [],
        objectiveMarkers: [],
        frontline: null
      }
    }
    const mapItems: z.infer<typeof schemas.MapItem>[] = []
    for (const airdromeName of playerCoalition.airdromeNames) {
      const airdrome = theatre.airdromeDetails[airdromeName]
      if (airdrome == null) continue
      mapItems.push({
        id: `player-${airdromeName}`,
        type: 'Airdrome',
        name: airdromeName,
        coalition: 'player',
        position: LOtoLL({
          theatre: theatre.name as 'Caucasus',
          x: airdrome.x,
          z: airdrome.y
        })
      })
    }
    for (const airdromeName of opponentCoalition.airdromeNames) {
      const airdrome = theatre.airdromeDetails[airdromeName]
      if (airdrome == null) continue
      mapItems.push({
        id: `opponent-${airdromeName}`,
        type: 'Airdrome',
        name: airdromeName,
        coalition: 'opponent',
        position: LOtoLL({
          theatre: theatre.name as 'Caucasus',
          x: airdrome.x,
          z: airdrome.y
        })
      })
    }
    const objectiveMarkers: ObjectiveMarker[] = []
    const objectivesByName = new Map(
      theatre.objectives.map((objective) => [objective.name, objective])
    )

    const playerObjectives: { x: number; y: number }[] = []
    const opponentObjectives: { x: number; y: number }[] = []

    const _addObjectiveMarkers = (
      objectiveIds: string[],
      coalition: z.infer<typeof schemas.coalition>
    ) => {
      for (const objectiveId of objectiveIds) {
        const objective = objectivesByName.get(objectiveId)
        if (objective == null) continue
        const latLng = LOtoLL({
          theatre: theatre.name as 'Caucasus',
          x: objective.position.x,
          z: objective.position.y
        })
        objectiveMarkers.push({
          id: `objective-${coalition}-${objectiveId}`,
          name: objectiveId,
          coalition,
          position: latLng
        })

        if (coalition === 'player') {
          playerObjectives.push(objective.position)
        } else {
          opponentObjectives.push(objective.position)
        }
      }
    }

    const addStructureMarkers = (
      structures: Array<{ id: string; type: string; objectiveId: string }>,
      coalition: z.infer<typeof schemas.coalition>
    ) => {
      for (const structure of structures) {
        const objective = objectivesByName.get(structure.objectiveId)
        if (objective == null) continue
        const latLng = LOtoLL({
          theatre: theatre.name as 'Caucasus',
          x: objective.position.x,
          z: objective.position.y
        })

        const structureTypeResult = schemas.structureType.safeParse(structure.type)
        if (!structureTypeResult.success) continue

        mapItems.push({
          id: structure.id,
          type: 'Structure',
          structureType: structureTypeResult.data,
          name: structure.type,
          coalition,
          position: latLng
        })
      }
    }

    _addObjectiveMarkers(playerCoalition.objectiveIds ?? [], 'player')
    _addObjectiveMarkers(opponentCoalition.objectiveIds ?? [], 'opponent')
    addStructureMarkers(playerCoalition.structures ?? [], 'player')
    addStructureMarkers(opponentCoalition.structures ?? [], 'opponent')

    let frontline: GeoJSON.FeatureCollection<GeoJSON.LineString> | null = null

    if (playerObjectives.length > 0 && opponentObjectives.length > 0) {
      const points = [
        ...playerObjectives.map((p) => turf.point([p.x, p.y], { coalition: 'player' })),
        ...opponentObjectives.map((p) => turf.point([p.x, p.y], { coalition: 'opponent' }))
      ]

      const collection = turf.featureCollection(points)
      const bbox = turf.bbox(collection)
      // expand bbox slightly to ensure we cover everything
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
        if (currentFeature && currentFeature.properties) {
          if (currentFeature.properties.coalition === 'player') {
            playerPolys.push(currentFeature)
          } else if (currentFeature.properties.coalition === 'opponent') {
            opponentPolys.push(currentFeature)
          }
        }
      })

      if (playerPolys.length > 0 && opponentPolys.length > 0) {
        const playerTerritory = turf.union(turf.featureCollection(playerPolys))
        const opponentTerritory = turf.union(turf.featureCollection(opponentPolys))

        if (playerTerritory && opponentTerritory) {
          const playerBoundary = turf.polygonToLine(playerTerritory)
          const opponentBoundary = turf.polygonToLine(opponentTerritory)

          if (playerBoundary && opponentBoundary) {
            // lineOverlap requires LineString or Polygon, but polygonToLine might return FeatureCollection.
            // Ensure we have geometries compatible with lineOverlap.
            // Actually turf.lineOverlap handles Feature<LineString|Polygon> etc.
            // But we need to be careful with FeatureCollections.

            // Helper to ensure we pass a Feature or Geometry to lineOverlap, not FeatureCollection if possible,
            // or handle FeatureCollection by flattening.
            // However, polygonToLine returns FeatureCollection<LineString> if input is MultiPolygon.

            // Let's simplify: convert everything to a list of LineStrings and check overlap?
            // No, turf.lineOverlap is efficient.

            // Hack: if FeatureCollection, take the features.
            // If single Feature, wrap in array.

            // Better approach: turf.lineOverlap accepts FeatureCollection in recent versions?
            // Docs say: source: Feature<LineString | MultiLineString | Polygon | MultiPolygon>
            // It does NOT say FeatureCollection.

            // So if playerBoundary is a FeatureCollection, we might need to union it or iterate.
            // But playerTerritory is a Feature<Polygon|MultiPolygon>.
            // We can pass playerTerritory directly to lineOverlap!
            // "Takes any LineString or Polygon and returns the overlapping lines between them."

            const overlapping = turf.lineOverlap(playerTerritory, opponentTerritory, {
              tolerance: 0.1
            })

            if (overlapping && overlapping.features.length > 0) {
              // Convert coordinates
              turf.coordEach(overlapping, (coord) => {
                const x = coord[0]
                const z = coord[1]
                if (x == null || z == null) return
                const ll = LOtoLL({
                  theatre: theatre.name as 'Caucasus',
                  x,
                  z
                })
                coord[0] = ll.lng
                coord[1] = ll.lat
              })
              frontline = overlapping
            }
          }
        }
      }
    }

    return {
      mapItems,
      objectiveMarkers,
      frontline
    }
  }, [playerCoalition, opponentCoalition, theatre])
}
