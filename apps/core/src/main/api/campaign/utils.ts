import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export const DISTANCE_VARIANCE = 0.2

export type CoalitionKey = z.infer<typeof schemas.coalition>
export type Position = z.infer<typeof schemas.position>

export type ObjectiveSeed = { id: string; position: Position }

export function getNearestDistance(position: Position, seeds: ObjectiveSeed[]): number {
  if (seeds.length === 0) return Number.POSITIVE_INFINITY
  return seeds.reduce((best, seed) => {
    const distance = getDistance(position, seed.position)
    return distance < best ? distance : best
  }, Number.POSITIVE_INFINITY)
}

export function getDistance(a: Position, b: Position) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

export function applyVariance(distance: number) {
  const variance = 1 + (Math.random() * 2 - 1) * DISTANCE_VARIANCE
  return distance * variance
}
