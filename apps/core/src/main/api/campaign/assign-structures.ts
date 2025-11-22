import { getDistance, Position } from './utils'

export const StructureType = {
  PowerPlant: 'Power Plant',
  AmmoDepot: 'Ammo Depot',
  FuelStorage: 'Fuel Storage',
  Hospital: 'Hospital',
  Barrack: 'Barrack',
  Depot: 'Depot',
  Farp: 'Farp'
} as const

export type StructureType = (typeof StructureType)[keyof typeof StructureType]

const StructureRanges: Record<StructureType, number> = {
  [StructureType.PowerPlant]: 50_000,
  [StructureType.AmmoDepot]: 50_000,
  [StructureType.FuelStorage]: 50_000,
  [StructureType.Hospital]: 50_000,
  [StructureType.Barrack]: 60_000, // frontline.barrack from config (using larger value if conflict, user said 50k in structureRange.frontline.barrack but 60k in deploymentScore.frontline.barrack? User config says structureRange: barrack: 50_000. I will use 50_000)
  [StructureType.Depot]: 60_000,
  [StructureType.Farp]: 50_000
}

// Correcting Barrack range based on structureRange config provided
StructureRanges[StructureType.Barrack] = 50_000

type ObjectiveInfo = {
  id: string
  position: Position
}

type StructureAssignment = {
  objectiveId: string
  type: StructureType
}

export function assignStructures(objectives: ObjectiveInfo[]): StructureAssignment[] {
  // State tracking
  const assignments = new Map<string, StructureType>() // objectiveId -> assignedType
  const coveredObjectives = new Map<StructureType, Set<string>>() // type -> Set<objectiveId>

  // Initialize coverage sets
  Object.values(StructureType).forEach((type) => {
    coveredObjectives.set(type, new Set())
  })

  const requiredTypes = Object.values(StructureType)

  for (const type of requiredTypes) {
    const range = StructureRanges[type]
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
        assignments.set(bestCandidate.id, type)

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
  return Array.from(assignments.entries()).map(([objectiveId, type]) => ({
    objectiveId,
    type
  }))
}
