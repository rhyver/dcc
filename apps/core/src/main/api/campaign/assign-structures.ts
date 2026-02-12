import { getDistance, Position } from './utils'
import { config, schemas } from '@dcc/contracts'
import { structureTemplates } from '@dcc/data'
import * as z from 'zod'

export const StructureType = [
  'Barrack',
  'Depot',
  'Power Plant',
  'Ammo Depot',
  'Fuel Storage',
  'Hospital',
  'Farp',
  'Command Center',
  'Prison'
] as const

export type StructureType = (typeof StructureType)[number]

type ObjectiveInfo = {
  id: string
  position: Position
  targets: Array<{
    name: string
    type: string
    position: Position
  }>
}

type StructureAssignment = {
  objectiveId: string
  type: StructureType
  position: Position
  name: string
  resources: number
  buildings: z.infer<typeof schemas.structureBuilding>[]
}

export function assignStructures(objectives: ObjectiveInfo[]): StructureAssignment[] {
  // State tracking
  const assignments = new Map<
    string,
    {
      type: StructureType
      position: Position
      name: string
      resources: number
      buildings: z.infer<typeof schemas.structureBuilding>[]
    }
  >() // objectiveId -> assignment info
  const coveredObjectives = new Map<StructureType, Set<string>>() // type -> Set<objectiveId>

  // Initialize coverage sets
  StructureType.forEach((type) => {
    coveredObjectives.set(type, new Set())
  })

  const requiredTypes = Object.values(StructureType)

  for (const type of requiredTypes) {
    const range = config.structureRanges[type]
    const coveredSet = coveredObjectives.get(type)!

    // Helper to check if an objective is covered by currently assigned structures of this type
    // (Note: In this greedy pass, we assign one type at a time, so initially for a new type, coverage is 0 unless we decide to support multi-role structures which we don't here)

    // Identify uncovered objectives
    let uncovered = objectives.filter((obj) => !coveredSet.has(obj.id))

    while (uncovered.length > 0) {
      let bestCandidate: ObjectiveInfo | null = null
      let maxCoveredCount = -1

      // Consider candidates: objectives that don't have a structure assignment yet
      const candidates = objectives.filter((obj) => !assignments.has(obj.id))

      if (candidates.length === 0) {
        // No more spots to place structures. Cannot achieve full coverage.
        // In a real scenario we might log a warning.
        break
      }

      for (const candidate of candidates) {
        // Calculate how many *currently uncovered* objectives this candidate would cover
        const wouldCover = uncovered.filter(
          (target) => getDistance(candidate.position, target.position) <= range
        )

        if (wouldCover.length > maxCoveredCount) {
          maxCoveredCount = wouldCover.length
          bestCandidate = candidate
        }
      }

      if (bestCandidate) {
        // Assign structure
        const structureTargets = bestCandidate.targets.filter((t) => t.type === 'Structure')
        const target =
          structureTargets.length > 0
            ? structureTargets[Math.floor(Math.random() * structureTargets.length)]
            : bestCandidate.targets[0]

        const position = target ? target.position : bestCandidate.position
        const name = target ? target.name : `Structure ${type} @ ${bestCandidate.id}`

        const templates = structureTemplates[type]
        const template = templates[Math.floor(Math.random() * templates.length)]
        const buildings = template.buildings.map((building) => ({
          ...building,
          alive: building.alive ?? true
        }))

        assignments.set(bestCandidate.id, { type, position, name, resources: 0, buildings })

        // Update coverage
        // We need to find ALL objectives this new structure covers, not just the currently uncovered ones, to maintain accurate state if we were tracking partials,
        // but here we just care about removing from 'uncovered' list for this iteration.
        // Actually, let's update the global coveredSet for this type
        objectives.forEach((obj) => {
          if (getDistance(bestCandidate!.position, obj.position) <= range) {
            coveredSet.add(obj.id)
          }
        })

        // Update uncovered list for next loop iteration
        uncovered = objectives.filter((obj) => !coveredSet.has(obj.id))
      } else {
        // Should not happen if candidates exist and we can at least cover self
        break
      }
    }
  }

  // Convert assignments map to array
  return Array.from(assignments.entries()).map(([objectiveId, info]) => ({
    objectiveId,
    type: info.type,
    position: info.position,
    name: info.name,
    resources: info.resources,
    buildings: info.buildings
  }))
}
