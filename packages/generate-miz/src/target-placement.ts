import { schemas } from '@dcc/contracts'
import * as z from 'zod'

type Theatre = z.infer<typeof schemas.theatre>
type Target = z.infer<typeof schemas.target>
type Position = z.infer<typeof schemas.position>

const MATCH_TOLERANCE_METERS = 1

function distance(a: Position, b: Position) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function positionsMatch(a: Position, b: Position) {
  return distance(a, b) <= MATCH_TOLERANCE_METERS
}

export function findTargetPlacement(
  theatre: Theatre,
  params: {
    objectiveName?: string
    type?: Target['type'] | Target['type'][]
    nameIncludes?: string
    position?: Position
  }
): Target | undefined {
  if (!params.objectiveName) return undefined

  const allowedTypes = Array.isArray(params.type)
    ? new Set(params.type)
    : params.type
      ? new Set([params.type])
      : undefined

  const targets = (theatre.targets[params.objectiveName] ?? []).filter((target) => {
    if (allowedTypes && !allowedTypes.has(target.type)) return false
    if (params.nameIncludes && !target.name.includes(params.nameIncludes)) return false
    return true
  })
  if (targets.length === 0) return undefined

  if (!params.position) {
    return targets[Math.floor(Math.random() * targets.length)]
  }

  return targets.find((target) => positionsMatch(target.position, params.position!))
}
