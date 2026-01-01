import { activeStore } from '@/stores/active'
import { useSelector } from '@xstate/store/react'
import { useMemo } from 'react'
import * as z from 'zod'
import { schemas } from '@dcc/contracts'
import { samTemplates } from '@dcc/data'
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
  flightGroups: z.infer<typeof schemas.flightGroup>[]
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
  const campaignTime = useSelector(activeStore, (state) => state.context.time)

  return useMemo(() => {
    if (theatre == null) {
      return {
        mapItems: [],
        objectiveMarkers: [],
        frontline: null,
        flightGroups: []
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
      structures: Array<{
        id: string
        type: string
        objectiveId: string
        position: { x: number; y: number }
        buildings: Array<{ alive: boolean }>
      }>,
      coalition: z.infer<typeof schemas.coalition>
    ) => {
      for (const structure of structures) {
        // Check if any building is alive. If all are dead, we consider the structure destroyed.
        const isDestroyed =
          structure.buildings.length > 0 && structure.buildings.every((b) => b.alive === false)

        if (isDestroyed) {
          continue
        }

        const structureTypeResult = schemas.structureType.safeParse(structure.type)
        if (!structureTypeResult.success) {
          continue
        }

        // Use the structure's actual position (from target data)
        const latLng = LOtoLL({
          theatre: theatre.name as 'Caucasus',
          x: structure.position.x,
          z: structure.position.y
        })

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

    const addGroundGroupMarkers = (
      groundGroups: Array<{
        id: string
        objectiveId?: string
        position: { x: number; y: number }
        units: Array<{ name: string; count: number }>
      }>,
      coalition: z.infer<typeof schemas.coalition>
    ) => {
      for (const group of groundGroups) {
        // Use the group's actual position (from target data)
        const latLng = LOtoLL({
          theatre: theatre.name as 'Caucasus',
          x: group.position.x,
          z: group.position.y
        })

        // Determine group type based on majority units or first unit
        // Since we have Vehicle and Infantry groups, we can infer type
        // For now, let's default to 'Vehicle' unless we detect infantry-heavy composition or explicit naming
        // But actually, the group structure doesn't have 'type'.
        // We can look at the units. If it has "Infantry" type units, it's infantry?
        // The schema doesn't store "Group Type" (Vehicle vs Infantry) explicitly in the saved state, just units.
        // However, the MapItem schema requires `groundGroupType` which is one of `groundUnitType`.

        // Simple heuristic: Check the first unit's likely type or just default to Vehicle if unsure.
        // In `assignGroundGroups`, we create groups based on template types.
        // But we don't persist "Vehicle Group" vs "Infantry Group" string.
        // Let's assume the first unit determines the icon for now.

        // However, `groundUnitType` enum includes 'SAM', 'Vehicle', 'Infantry', etc.
        // Let's guess based on unit name or just use 'Vehicle' as generic.
        // Better: Check if any unit name contains 'Infantry' or 'Soldier'?
        // Or just check if the template defined them as Infantry.

        // For rendering, we need a valid `groundUnitType`.
        // Let's try to deduce it.

        const isInfantry = group.units.some(
          (u) =>
            u.name.toLowerCase().includes('infantry') || u.name.toLowerCase().includes('soldier')
        )

        const groupType = isInfantry ? 'Infantry' : 'Vehicle'

        mapItems.push({
          id: group.id,
          type: 'Ground Group',
          groundGroupType: groupType,
          name: `${groupType} Group`, // or generate a better name
          coalition,
          position: latLng
        })
      }
    }

    const addSamMarkers = (
      samGroups: Array<{ id: string; type: z.infer<typeof schemas.samType>; objectiveId: string }>,
      coalition: z.infer<typeof schemas.coalition>
    ) => {
      for (const samGroup of samGroups) {
        const objective = objectivesByName.get(samGroup.objectiveId)
        if (objective == null) continue

        const samTemplate = samTemplates[samGroup.type]
        if (samTemplate == null) continue

        const latLng = LOtoLL({
          theatre: theatre.name as 'Caucasus',
          x: objective.position.x,
          z: objective.position.y
        })

        mapItems.push({
          id: samGroup.id,
          type: 'SAM',
          name: samGroup.type,
          coalition,
          position: latLng,
          range: samTemplate.range,
          active: true
        })
      }
    }

    const addFlightGroupMarkers = (
      flightGroups: z.infer<typeof schemas.flightGroup>[],
      coalition: z.infer<typeof schemas.coalition>
    ) => {
      for (const group of flightGroups) {
        // Check if group has taken off
        const startTime = new Date(group.flightplan.startTime)
        if (campaignTime < startTime) continue

        const latLng = LOtoLL({
          theatre: theatre.name as 'Caucasus',
          x: group.position.x,
          z: group.position.y
        })

        mapItems.push({
          id: group.id,
          type: 'Flight Group',
          name: group.callsign || 'Flight Group',
          callsign: group.callsign,
          task: group.task,
          flightplan: group.flightplan,
          coalition,
          position: latLng
        })
      }
    }

    //_addObjectiveMarkers(playerCoalition.objectiveIds ?? [], 'player')
    //_addObjectiveMarkers(opponentCoalition.objectiveIds ?? [], 'opponent')
    addStructureMarkers(playerCoalition.structures ?? [], 'player')
    addStructureMarkers(opponentCoalition.structures ?? [], 'opponent')
    addGroundGroupMarkers(playerCoalition.groundGroups ?? [], 'player')
    addGroundGroupMarkers(opponentCoalition.groundGroups ?? [], 'opponent')
    addSamMarkers(playerCoalition.samGroups ?? [], 'player')
    addSamMarkers(opponentCoalition.samGroups ?? [], 'opponent')
    addFlightGroupMarkers(playerCoalition.flightGroups ?? [], 'player')
    addFlightGroupMarkers(opponentCoalition.flightGroups ?? [], 'opponent')

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

    const allFlightGroups = [
      ...(playerCoalition.flightGroups ?? []),
      ...(opponentCoalition.flightGroups ?? [])
    ]

    return {
      mapItems,
      objectiveMarkers,
      frontline,
      flightGroups: allFlightGroups
    }
  }, [playerCoalition, opponentCoalition, theatre, campaignTime])
}
