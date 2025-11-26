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

/** Shuffle array in place using Fisher-Yates algorithm */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/** Pick a random element from candidates within threshold of the best coverage */
function pickRandomFromTopCandidates(
  candidates: Array<{ candidate: ObjectiveInfo; coverCount: number }>,
  threshold = 0.7
): ObjectiveInfo | null {
  if (candidates.length === 0) return null

  const maxCover = Math.max(...candidates.map((c) => c.coverCount))
  const minAcceptable = Math.floor(maxCover * threshold)

  // Filter to candidates that cover at least threshold% of the best
  const topCandidates = candidates.filter((c) => c.coverCount >= minAcceptable)

  // Pick randomly from the top candidates
  const randomIndex = Math.floor(Math.random() * topCandidates.length)
  return topCandidates[randomIndex].candidate
}

/**
 * Assigns SAM groups to objectives using a randomized greedy set-cover approach.
 *
 * For player coalition: SAMs are placed to cover all player objectives.
 * For opponent coalition: SAMs are placed to cover all opponent objectives,
 * but positions that would reach any player objective are excluded.
 *
 * Randomness is introduced by:
 * - Shuffling candidate evaluation order
 * - Selecting randomly from top candidates (within 70% of best coverage)
 * - Randomly adding extra SAMs beyond minimum coverage (20% chance per valid position)
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
    console.warn(`Cannot place ${samType} SAMs: all positions would reach forbidden objectives`)
    return []
  }

  const assignments: SamAssignment[] = []
  const coveredObjectives = new Set<string>()

  // Shuffle valid candidates to introduce randomness in evaluation order
  const shuffledCandidates = shuffleArray(validCandidates)

  // Greedy set-cover with randomization: pick from top candidates randomly
  let uncovered = coalitionObjectives.filter((obj) => !coveredObjectives.has(obj.id))

  while (uncovered.length > 0) {
    const availableCandidates = shuffledCandidates.filter(
      (c) => !assignments.some((a) => a.objectiveId === c.id)
    )

    if (availableCandidates.length === 0) {
      // No more positions available, cannot achieve full coverage
      console.warn(
        `Cannot achieve full SAM coverage: ${uncovered.length} objectives remain uncovered`
      )
      break
    }

    // Calculate coverage for each candidate
    const candidatesWithCoverage = availableCandidates.map((candidate) => {
      const wouldCover = uncovered.filter(
        (target) => getDistance(candidate.position, target.position) <= range
      )
      return { candidate, coverCount: wouldCover.length }
    })

    // Pick randomly from top candidates
    const selectedCandidate = pickRandomFromTopCandidates(
      candidatesWithCoverage.filter((c) => c.coverCount > 0)
    )

    if (selectedCandidate) {
      assignments.push({
        objectiveId: selectedCandidate.id,
        type: samType
      })

      // Update coverage
      coalitionObjectives.forEach((obj) => {
        if (getDistance(selectedCandidate.position, obj.position) <= range) {
          coveredObjectives.add(obj.id)
        }
      })

      uncovered = coalitionObjectives.filter((obj) => !coveredObjectives.has(obj.id))
    } else {
      // No candidate can cover any uncovered objective
      break
    }
  }

  // Randomly add extra SAMs for redundant coverage (20% chance per remaining valid position)
  const remainingCandidates = shuffledCandidates.filter(
    (c) => !assignments.some((a) => a.objectiveId === c.id)
  )

  for (const candidate of remainingCandidates) {
    // 20% chance to add an extra SAM at this position
    if (Math.random() < 0.2) {
      // Only add if it would cover at least one objective
      const wouldCover = coalitionObjectives.some(
        (obj) => getDistance(candidate.position, obj.position) <= range
      )
      if (wouldCover) {
        assignments.push({
          objectiveId: candidate.id,
          type: samType
        })
      }
    }
  }

  return assignments
}
