import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { applyVariance, getNearestDistance, ObjectiveSeed } from './utils'

type CoalitionKey = z.infer<typeof schemas.coalition>
type TheatreObjective = z.infer<typeof schemas.objective>
type ScenarioStart = z.infer<typeof schemas.scenario>['start']

type AssignObjectivesParams = {
  objectives: TheatreObjective[]
  start: ScenarioStart
  onMissingObjective: (params: { coalition: CoalitionKey; objectiveId: string }) => never
}

const coalitionKeys = schemas.coalition.options as CoalitionKey[]

export function assignObjectivesToCoalitions({
  objectives,
  start,
  onMissingObjective
}: AssignObjectivesParams): Record<CoalitionKey, string[]> {
  const objectiveMap = new Map<string, TheatreObjective>(
    objectives.map((objective) => [objective.name, objective])
  )

  const seeds = {} as Record<CoalitionKey, ObjectiveSeed[]>
  const assignments = {} as Record<CoalitionKey, string[]>

  for (const coalition of coalitionKeys) {
    const coalitionStart = start[coalition]
    const baseObjectiveIds = coalitionStart?.objectiveIds ?? []
    const uniqueObjectiveIds = Array.from(new Set(baseObjectiveIds))

    assignments[coalition] = [...uniqueObjectiveIds]
    seeds[coalition] = uniqueObjectiveIds.map((objectiveId) => {
      const objective = objectiveMap.get(objectiveId)
      if (objective == null) {
        onMissingObjective({ coalition, objectiveId })
      }
      const ensuredObjective = objective ?? objectiveMap.get(objectiveId)!
      return {
        id: objectiveId,
        position: ensuredObjective.position
      }
    })
  }

  const assignedObjectiveIds = new Set<string>(
    coalitionKeys.flatMap((coalition) => assignments[coalition])
  )

  for (const objective of objectives) {
    if (assignedObjectiveIds.has(objective.name)) continue

    let chosenCoalition: CoalitionKey | null = null
    let bestDistance = Number.POSITIVE_INFINITY

    for (const coalition of coalitionKeys) {
      const distance = getNearestDistance(objective.position, seeds[coalition])
      const jitteredDistance =
        distance === Number.POSITIVE_INFINITY ? distance : applyVariance(distance)
      if (jitteredDistance < bestDistance) {
        bestDistance = jitteredDistance
        chosenCoalition = coalition
      }
    }

    if (chosenCoalition == null) {
      chosenCoalition = coalitionKeys[0]
    }

    assignments[chosenCoalition].push(objective.name)
    assignedObjectiveIds.add(objective.name)
  }

  return assignments
}
