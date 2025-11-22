import { activeStore } from '@/stores/active'
import { useSelector } from '@xstate/store/react'
import { useMemo } from 'react'
import * as z from 'zod'
import { schemas } from '@dcc/contracts'
import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc'
import { LOtoLL } from '@kilcekru/dcs-coordinates'

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
        objectiveMarkers: []
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

    // addObjectiveMarkers(playerCoalition.objectiveIds ?? [], 'player')
    // addObjectiveMarkers(opponentCoalition.objectiveIds ?? [], 'opponent')
    addStructureMarkers(playerCoalition.structures ?? [], 'player')
    addStructureMarkers(opponentCoalition.structures ?? [], 'opponent')

    return {
      mapItems,
      objectiveMarkers
    }
  }, [playerCoalition, opponentCoalition, theatre])
}
