import { schemas } from '@dcc/contracts'
import { aircrafts, scenarios, theatres } from '@dcc/data'
import * as z from 'zod'

import { calculateDistance } from '@/logic/utils/calculate-distance'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type Position = z.infer<typeof schemas.position>
type AircraftName = z.infer<typeof schemas.dcs.aircraftName>
type Scenario = z.infer<typeof schemas.scenario>
type Theatre = z.infer<typeof schemas.theatre>

const helicopterAircraftTypes = new Set(
  Object.values(aircrafts)
    .filter((aircraft) => aircraft.isHelicopter)
    .map((aircraft) => aircraft.name)
)

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

  for (const carrier of draft.coalitions[coalition].navalGroups ?? []) {
    if (carrier.role !== 'carrier' || carrier.state === 'sunk' || carrier.damage >= 0.75) continue
    homeBases.push({
      name: carrier.id,
      position: { ...carrier.position },
      runwayAngle: carrier.heading
    })
  }

  return homeBases
}

export function getCoalitionFarps(draft: Campaign, coalition: Coalition): AirdromeSelection[] {
  return draft.coalitions[coalition].structures
    .filter((structure) => structure.type === 'Farp')
    .map((structure) => ({
      name: structure.id,
      position: structure.position
    }))
}

export function getCoalitionCasHomeBases(
  draft: Campaign,
  theatre: Theatre,
  coalition: Coalition,
  aircraftType: AircraftName
): AirdromeSelection[] {
  const airdromes = getCoalitionAirdromes(draft, theatre, coalition)
  return helicopterAircraftTypes.has(aircraftType)
    ? [...airdromes, ...getCoalitionFarps(draft, coalition)]
    : airdromes
}

export function pickRandomAircraftType(aircraftTypes: string[]): AircraftName | null {
  const selectedAircraftType = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)]
  return selectedAircraftType ? (selectedAircraftType as AircraftName) : null
}

export function selectHomeBaseAndTarget<T>({
  homeBases,
  targets,
  maxDistance,
  preference = 'random'
}: {
  homeBases: AirdromeSelection[]
  targets: LocatedTarget<T>[]
  maxDistance: number
  preference?: 'nearest' | 'farthest' | 'random'
}): { homeBase: AirdromeSelection; target: T; targetPosition: Position } | null {
  let preferredAssignment: {
    homeBase: AirdromeSelection
    target: T
    targetPosition: Position
    distance: number
  } | null = null
  const randomAssignments: Array<{
    homeBase: AirdromeSelection
    targets: Array<{ target: T; targetPosition: Position }>
  }> = []

  for (const homeBase of homeBases) {
    const reachableTargets: Array<{ target: T; targetPosition: Position }> = []

    for (const locatedTarget of targets) {
      const distance = calculateDistance(homeBase.position, locatedTarget.position)
      if (distance <= maxDistance) {
        if (preference !== 'random') {
          const isPreferred =
            !preferredAssignment ||
            (preference === 'nearest'
              ? distance < preferredAssignment.distance
              : distance > preferredAssignment.distance)
          if (isPreferred) {
            preferredAssignment = {
              homeBase,
              target: locatedTarget.target,
              targetPosition: locatedTarget.position,
              distance
            }
          }
          continue
        }

        if (preference === 'random') {
          reachableTargets.push({
            target: locatedTarget.target,
            targetPosition: locatedTarget.position
          })
          continue
        }
      }
    }

    if (reachableTargets.length > 0) {
      randomAssignments.push({ homeBase, targets: reachableTargets })
    }
  }

  if (preferredAssignment) {
    return {
      homeBase: preferredAssignment.homeBase,
      target: preferredAssignment.target,
      targetPosition: preferredAssignment.targetPosition
    }
  }

  const randomAssignment = randomAssignments[Math.floor(Math.random() * randomAssignments.length)]
  if (randomAssignment) {
    const randomTarget =
      randomAssignment.targets[Math.floor(Math.random() * randomAssignment.targets.length)]
    if (randomTarget) {
      return {
        homeBase: randomAssignment.homeBase,
        target: randomTarget.target,
        targetPosition: randomTarget.targetPosition
      }
    }
  }

  return null
}

const CAP_PATROL_STACK_OFFSET = 25_000

function assignCapPatrolForHomeBase(
  homeBase: AirdromeSelection,
  enemyAirdromes: AirdromeSelection[],
  maxHomeToEnemyDistance: number,
  patrolStackIndex = 0
): { homeBase: AirdromeSelection; patrolCenter: Position } | null {
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
    return null
  }

  const dx = nearestEnemy.position.x - homeBase.position.x
  const dy = nearestEnemy.position.y - homeBase.position.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance === 0) {
    return null
  }
  const ux = dx / distance
  const uy = dy / distance
  const patrolDistance = Math.min(50000, distance * 0.3)
  const px = -uy
  const py = ux
  const patrolOffset = patrolStackIndex * CAP_PATROL_STACK_OFFSET

  return {
    homeBase,
    patrolCenter: {
      x: homeBase.position.x + ux * patrolDistance + px * patrolOffset,
      y: homeBase.position.y + uy * patrolDistance + py * patrolOffset
    }
  }
}

export function selectCapPatrolAssignment({
  homeBases,
  enemyAirdromes,
  coveredHomeBases,
  maxHomeToEnemyDistance,
  allowCoveredHomeBases = false,
  capPatrolCountByHomeBase = new Map<string, number>()
}: {
  homeBases: AirdromeSelection[]
  enemyAirdromes: AirdromeSelection[]
  coveredHomeBases: Set<string>
  maxHomeToEnemyDistance: number
  allowCoveredHomeBases?: boolean
  capPatrolCountByHomeBase?: Map<string, number>
}): { homeBase: AirdromeSelection; patrolCenter: Position } | null {
  for (const homeBase of homeBases) {
    if (coveredHomeBases.has(homeBase.name)) {
      continue
    }

    const assignment = assignCapPatrolForHomeBase(homeBase, enemyAirdromes, maxHomeToEnemyDistance)
    if (assignment) {
      return assignment
    }
  }

  if (allowCoveredHomeBases) {
    for (const homeBase of homeBases) {
      const assignment = assignCapPatrolForHomeBase(
        homeBase,
        enemyAirdromes,
        maxHomeToEnemyDistance,
        capPatrolCountByHomeBase.get(homeBase.name) ?? 0
      )
      if (assignment) {
        return assignment
      }
    }
  }

  return null
}
