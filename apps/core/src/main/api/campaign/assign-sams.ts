import { schemas } from '@dcc/contracts'
import { samTemplates } from '@dcc/data'
import * as z from 'zod'

import { getDistance, Position } from './utils'

type SamType = z.infer<typeof schemas.samType>
type ObjectiveInfo = { id: string; position: Position }

type SamAssignment = {
  objectiveId: string
  type: SamType
}

type AssignSamsParams = {
  /** Objectives belonging to this coalition (where SAMs can be placed) */
  coalitionObjectives: ObjectiveInfo[]
  /** SAM type to use (from template) */
  samType: SamType
  /** Objectives that must NOT be reachable by SAMs (for opponent constraint) */
  forbiddenObjectives?: ObjectiveInfo[]
}

/**
 * Assigns SAM groups to objectives using a greedy set-cover approach.
 *
 * For player coalition: SAMs are placed to cover all player objectives.
 * For opponent coalition: SAMs are placed to cover all opponent objectives,
 * but positions that would reach any player objective are excluded.
 */
export function assignSams({
  coalitionObjectives,
  samType,
  forbiddenObjectives = []
}: AssignSamsParams): SamAssignment[] {
  const samTemplate = samTemplates[samType]
  if (!samTemplate) {
    console.warn(`Unknown SAM type: ${samType}`)
    return []
  }

  const range = samTemplate.range

  // Filter candidate positions: objectives where placing a SAM would NOT reach forbidden objectives
  const validCandidates = coalitionObjectives.filter((candidate) => {
    // Check if this position would reach any forbidden objective
    const reachesForbidden = forbiddenObjectives.some(
      (forbidden) => getDistance(candidate.position, forbidden.position) <= range
    )
    return !reachesForbidden
  })

  if (validCandidates.length === 0 && forbiddenObjectives.length > 0) {
    // All positions would reach forbidden objectives - no SAMs can be placed
    console.warn(
      `Cannot place ${samType} SAMs: all positions would reach forbidden objectives`
    )
    return []
  }

  const assignments: SamAssignment[] = []
  const coveredObjectives = new Set<string>()

  // Greedy set-cover: repeatedly pick the candidate that covers the most uncovered objectives
  let uncovered = coalitionObjectives.filter((obj) => !coveredObjectives.has(obj.id))

  while (uncovered.length > 0) {
    const availableCandidates = validCandidates.filter(
      (c) => !assignments.some((a) => a.objectiveId === c.id)
    )

    if (availableCandidates.length === 0) {
      // No more positions available, cannot achieve full coverage
      console.warn(
        `Cannot achieve full SAM coverage: ${uncovered.length} objectives remain uncovered`
      )
      break
    }

    let bestCandidate: ObjectiveInfo | null = null
    let maxCoveredCount = -1

    for (const candidate of availableCandidates) {
      const wouldCover = uncovered.filter(
        (target) => getDistance(candidate.position, target.position) <= range
      )

      if (wouldCover.length > maxCoveredCount) {
        maxCoveredCount = wouldCover.length
        bestCandidate = candidate
      }
    }

    if (bestCandidate && maxCoveredCount > 0) {
      assignments.push({
        objectiveId: bestCandidate.id,
        type: samType
      })

      // Update coverage
      coalitionObjectives.forEach((obj) => {
        if (getDistance(bestCandidate!.position, obj.position) <= range) {
          coveredObjectives.add(obj.id)
        }
      })

      uncovered = coalitionObjectives.filter((obj) => !coveredObjectives.has(obj.id))
    } else {
      // No candidate can cover any uncovered objective
      break
    }
  }

  return assignments
}

