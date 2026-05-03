import { activeStore } from '@/stores/active'
import { useSelector } from '@xstate/store/react'
import { useMemo } from 'react'
import * as z from 'zod'
import { schemas } from '@dcc/contracts'
import { isSamOperational, samTemplates } from '@dcc/data'
import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc'
import { LOtoLL } from '@kilcekru/dcs-coordinates'
import * as turf from '@turf/turf'
import { hasFlightGroupTakenOff } from '@/logic/entities/flight-status'
import { getGroundGroupSpawnCost } from '@/logic/systems/spawn/ground-group-costs'

export type ObjectiveMarker = {
  id: string
  name: string
  coalition: z.infer<typeof schemas.coalition>
  isGoal?: boolean
  position: {
    lng: number
    lat: number
  }
}

export function useMapItems(options: { showGoalMarkers?: boolean } = {}): {
  mapItems: z.infer<typeof schemas.MapItem>[]
  objectiveMarkers: ObjectiveMarker[]
  frontline: GeoJSON.FeatureCollection<GeoJSON.LineString> | null
  flightGroups: z.infer<typeof schemas.flightGroup>[]
} {
  const playerCoalition = useSelector(activeStore, (state) => state.context.coalitions.player)
  const opponentCoalition = useSelector(activeStore, (state) => state.context.coalitions.opponent)
  const campaignGoal = useSelector(activeStore, (state) => state.context.goal)
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
  const scenarioGoal = scenarioQuery.data?.goal
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
    const getControllingCoalition = (objectiveId: string): z.infer<typeof schemas.coalition> => {
      if (playerCoalition.objectiveIds?.includes(objectiveId)) return 'player'
      if (opponentCoalition.objectiveIds?.includes(objectiveId)) return 'opponent'
      return 'player'
    }

    const _addObjectiveMarkers = (
      objectiveIds: string[],
      coalition: z.infer<typeof schemas.coalition>,
      options: { goal?: boolean } = {}
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
          coalition: options.goal ? getControllingCoalition(objectiveId) : coalition,
          isGoal: options.goal,
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
        resources: number
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

        const isResourceStructure =
          structureTypeResult.data === 'Barrack' || structureTypeResult.data === 'Depot'
        const totalResources = isResourceStructure ? structure.resources : undefined
        const spawnCost =
          structureTypeResult.data === 'Barrack' || structureTypeResult.data === 'Depot'
            ? getGroundGroupSpawnCost(structureTypeResult.data)
            : undefined

        mapItems.push({
          id: structure.id,
          type: 'Structure',
          objectiveId: structure.objectiveId,
          structureType: structureTypeResult.data,
          name: structure.type,
          coalition,
          position: latLng,
          resources: totalResources,
          spawnCost
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
        const liveUnitCount = group.units.reduce((sum, unit) => sum + Math.max(0, unit.count), 0)
        if (liveUnitCount <= 0) {
          continue
        }

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
          objectiveId: group.objectiveId,
          groundGroupType: groupType,
          name: `${groupType} Group`, // or generate a better name
          coalition,
          position: latLng
        })
      }
    }

    const addSamMarkers = (
      samGroups: Array<z.infer<typeof schemas.campaign.campaignSamGroup>>,
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
          objectiveId: samGroup.objectiveId,
          name: samGroup.type,
          coalition,
          position: latLng,
          range: samTemplate.range,
          active: isSamOperational(samGroup)
        })
      }
    }

    const addFlightGroupMarkers = (
      flightGroups: z.infer<typeof schemas.flightGroup>[],
      coalition: z.infer<typeof schemas.coalition>
    ) => {
      for (const group of flightGroups) {
        if (!hasFlightGroupTakenOff(group, campaignTime)) continue

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
    const goal = campaignGoal ?? scenarioGoal
    if (options.showGoalMarkers && goal) {
      _addObjectiveMarkers(goal.objectiveIds, goal.coalition, { goal: true })
    }
    for (const objectiveId of playerCoalition.objectiveIds ?? []) {
      const objective = objectivesByName.get(objectiveId)
      if (objective != null) playerObjectives.push(objective.position)
    }
    for (const objectiveId of opponentCoalition.objectiveIds ?? []) {
      const objective = objectivesByName.get(objectiveId)
      if (objective != null) opponentObjectives.push(objective.position)
    }
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
        // Find shared edges between player and opponent Voronoi cells.
        // Adjacent Voronoi cells share an edge with identical endpoint coordinates,
        // so we can match by canonical (rounded, order-independent) endpoint key.
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

        const frontlineSegments: GeoJSON.Feature<GeoJSON.LineString>[] = []
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
            const az = a[1]
            const bx = b[0]
            const bz = b[1]
            if (ax == null || az == null || bx == null || bz == null) continue
            const aLL = LOtoLL({ theatre: theatre.name as 'Caucasus', x: ax, z: az })
            const bLL = LOtoLL({ theatre: theatre.name as 'Caucasus', x: bx, z: bz })
            frontlineSegments.push(
              turf.lineString([
                [aLL.lng, aLL.lat],
                [bLL.lng, bLL.lat]
              ])
            )
          }
        }

        if (frontlineSegments.length > 0) {
          frontline = turf.featureCollection(frontlineSegments)
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
  }, [
    playerCoalition,
    opponentCoalition,
    campaignGoal,
    scenarioGoal,
    theatre,
    campaignTime,
    options.showGoalMarkers
  ])
}
