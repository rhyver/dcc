import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { getDistance, Position } from './utils'

const NM_TO_METERS = 1852
const THRESHOLD_DISTANCE = 20 * NM_TO_METERS

type ObjectiveInfo = {
  id: string
  position: Position
  targets: Array<{
    name: string
    type: string
    position: Position
  }>
}

type GroundGroupUnit = {
  name: string
  count: number
}

export type GroundGroupAssignment = {
  objectiveId: string
  units: GroundGroupUnit[]
  position: Position
}

type AssignGroundGroupsParams = {
  coalitionObjectives: ObjectiveInfo[]
  enemyObjectives: ObjectiveInfo[]
  template: z.infer<typeof schemas.template>
}

export function assignGroundGroups({
  coalitionObjectives,
  enemyObjectives,
  template
}: AssignGroundGroupsParams): GroundGroupAssignment[] {
  const assignments: GroundGroupAssignment[] = []

  const vehicleTypes = template.groundUnitTypes.Vehicle || []
  const infantryTypes = template.groundUnitTypes.Infantry || []
  const shoradVehicleTypes = template.groundUnitTypes['Shorad Vehicle'] || []
  const shoradInfantryTypes = template.groundUnitTypes['Shorad Infantry'] || []

  // If no basic units available, we can't create groups
  if (vehicleTypes.length === 0 && infantryTypes.length === 0) {
    return []
  }

  for (const objective of coalitionObjectives) {
    // Check distance to nearest enemy objective
    const nearestEnemyDistance = enemyObjectives.reduce((minDist, enemy) => {
      const dist = getDistance(objective.position, enemy.position)
      return dist < minDist ? dist : minDist
    }, Number.POSITIVE_INFINITY)

    if (nearestEnemyDistance <= THRESHOLD_DISTANCE) {
      // Get Vehicle targets for positioning ground groups
      const vehicleTargets = objective.targets.filter((t) => t.type === 'Vehicle')

      // Create groups at different Vehicle target positions
      // 1. Vehicle Group - use first Vehicle target or objective position
      if (vehicleTypes.length > 0) {
        const vehicleTarget = vehicleTargets[0]
        assignments.push(
          createGroup({
            objectiveId: objective.id,
            position: vehicleTarget?.position ?? objective.position,
            unitTypes: vehicleTypes,
            shoradTypes: shoradVehicleTypes
          })
        )
      }

      // 2. Infantry Group - use second Vehicle target or offset from first, or objective position
      if (infantryTypes.length > 0) {
        const infantryTarget = vehicleTargets[1] ?? vehicleTargets[0]
        assignments.push(
          createGroup({
            objectiveId: objective.id,
            position: infantryTarget?.position ?? objective.position,
            unitTypes: infantryTypes,
            shoradTypes: shoradInfantryTypes
          })
        )
      }
    }
  }

  return assignments
}

function createGroup({
  objectiveId,
  position,
  unitTypes,
  shoradTypes
}: {
  objectiveId: string
  position: Position
  unitTypes: string[]
  shoradTypes: string[]
}): GroundGroupAssignment {
  const groupSize = Math.floor(Math.random() * (8 - 5 + 1)) + 5 // 5 to 8
  const units: GroundGroupUnit[] = []

  // Determine number of SHORADs (high chance for 1-2)
  // "High chance" -> 80% chance to have SHORADs
  let shoradCount = 0
  if (shoradTypes.length > 0 && Math.random() < 0.8) {
    shoradCount = Math.floor(Math.random() * 2) + 1 // 1 or 2
  }

  // Ensure we don't exceed group size with SHORADs alone (unlikely given constraints)
  shoradCount = Math.min(shoradCount, groupSize)

  const basicUnitCount = groupSize - shoradCount

  // Add basic units
  if (basicUnitCount > 0) {
    const basicType = unitTypes[Math.floor(Math.random() * unitTypes.length)]
    units.push({ name: basicType, count: basicUnitCount })
  }

  // Add SHORADs if any
  if (shoradCount > 0) {
    const shoradType = shoradTypes[Math.floor(Math.random() * shoradTypes.length)]
    units.push({ name: shoradType, count: shoradCount })
  }

  return {
    objectiveId,
    units,
    position
  }
}
