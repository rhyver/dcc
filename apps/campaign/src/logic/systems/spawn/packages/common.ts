import { schemas } from '@dcc/contracts'
import { scenarios, theatres } from '@dcc/data'
import * as z from 'zod'

import { calculateDistance } from '@/logic/utils/calculate-distance'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type Position = z.infer<typeof schemas.position>
type AircraftName = z.infer<typeof schemas.dcs.aircraftName>
type Scenario = z.infer<typeof schemas.scenario>
type Theatre = z.infer<typeof schemas.theatre>

export type AirdromeSelection = {
  name: string
  position: Position
  runwayAngle?: number
}

export type SpawnContext = {
  scenario: Scenario
  theatre: Theatre
  enemyCoalition: Coalition
}

export type LocatedTarget<T> = {
  target: T
  position: Position
}

export function resolveSpawnContext(draft: Campaign, coalition: Coalition): SpawnContext | null {
  const scenario = scenarios.find((s) => s.id === draft.scenarioId)
  if (!scenario) {
    console.error('Scenario not found:', draft.scenarioId)
    return null
  }

  const theatre = theatres.find((t) => t.name === scenario.theatreName)
  if (!theatre) {
    console.error('Theatre not found:', scenario.theatreName)
    return null
  }

  return {
    scenario,
    theatre,
    enemyCoalition: coalition === 'player' ? 'opponent' : 'player'
  }
}

export function getCoalitionAirdromes(
  draft: Campaign,
  theatre: Theatre,
  coalition: Coalition
): AirdromeSelection[] {
  const homeBaseNames = draft.coalitions[coalition].airdromeNames
  const homeBases: AirdromeSelection[] = []

  for (const homeBaseName of homeBaseNames) {
    const airdrome = theatre.airdromeDetails[homeBaseName]
    if (!airdrome) {
      continue
    }
    homeBases.push({
      name: homeBaseName,
      position: { x: airdrome.x, y: airdrome.y },
      runwayAngle: airdrome.runwayAngle
    })
  }

  return homeBases
}

export function pickRandomAircraftType(aircraftTypes: string[]): AircraftName | null {
  const selectedAircraftType = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)]
  return selectedAircraftType ? (selectedAircraftType as AircraftName) : null
}

export function selectHomeBaseAndTarget<T>({
  homeBases,
  targets,
  maxDistance
}: {
  homeBases: AirdromeSelection[]
  targets: LocatedTarget<T>[]
  maxDistance: number
}): { homeBase: AirdromeSelection; target: T; targetPosition: Position } | null {
  for (const homeBase of homeBases) {
    for (const locatedTarget of targets) {
      const distance = calculateDistance(homeBase.position, locatedTarget.position)
      if (distance <= maxDistance) {
        return {
          homeBase,
          target: locatedTarget.target,
          targetPosition: locatedTarget.position
        }
      }
    }
  }

  return null
}

export function selectCapPatrolAssignment({
  homeBases,
  enemyAirdromes,
  coveredHomeBases,
  maxHomeToEnemyDistance
}: {
  homeBases: AirdromeSelection[]
  enemyAirdromes: AirdromeSelection[]
  coveredHomeBases: Set<string>
  maxHomeToEnemyDistance: number
}): { homeBase: AirdromeSelection; patrolCenter: Position } | null {
  for (const homeBase of homeBases) {
    if (coveredHomeBases.has(homeBase.name)) {
      continue
    }

    let nearestEnemyDistance = Number.POSITIVE_INFINITY
    let nearestEnemy: AirdromeSelection | null = null

    for (const enemyAirdrome of enemyAirdromes) {
      const distance = calculateDistance(homeBase.position, enemyAirdrome.position)
      if (distance < nearestEnemyDistance) {
        nearestEnemyDistance = distance
        nearestEnemy = enemyAirdrome
      }
    }

    if (nearestEnemy == null || nearestEnemyDistance > maxHomeToEnemyDistance) {
      continue
    }

    const dx = nearestEnemy.position.x - homeBase.position.x
    const dy = nearestEnemy.position.y - homeBase.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance === 0) {
      continue
    }
    const ux = dx / distance
    const uy = dy / distance
    const patrolDistance = Math.min(50000, distance * 0.3)

    return {
      homeBase,
      patrolCenter: {
        x: homeBase.position.x + ux * patrolDistance,
        y: homeBase.position.y + uy * patrolDistance
      }
    }
  }

  return null
}
