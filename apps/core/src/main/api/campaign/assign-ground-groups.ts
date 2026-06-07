import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { getDistance, Position } from './utils'

const NM_TO_METERS = 1852
const THRESHOLD_DISTANCE = 20 * NM_TO_METERS
const EMBEDDED_AIR_DEFENSE_CHANCE = 0.8
const EMBEDDED_MISSILE_AIR_DEFENSE_CHANCE = 0.25

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
      const targetPosition = vehicleTargets[0]?.position ?? objective.position

      // Randomly choose either Vehicle or Infantry group (never both at same objective)
      const canCreateVehicle = vehicleTypes.length > 0
      const canCreateInfantry = infantryTypes.length > 0

      let createVehicleGroup: boolean
      if (canCreateVehicle && canCreateInfantry) {
        // Both available - randomly pick one
        createVehicleGroup = Math.random() < 0.5
      } else {
        // Only one type available
        createVehicleGroup = canCreateVehicle
      }

      if (createVehicleGroup && canCreateVehicle) {
        assignments.push(
          createGroup({
            objectiveId: objective.id,
            position: targetPosition,
            unitTypes: vehicleTypes,
            shoradTypes: shoradVehicleTypes
          })
        )
      } else if (canCreateInfantry) {
        assignments.push(
          createGroup({
            objectiveId: objective.id,
            position: targetPosition,
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

  // Embedded air defense is common, but usually gun AAA rather than missile SHORAD.
  const airDefenseTypes = chooseEmbeddedAirDefenseTypes(shoradTypes)
  let shoradCount = 0
  if (airDefenseTypes.length > 0) {
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
    const shoradType = airDefenseTypes[Math.floor(Math.random() * airDefenseTypes.length)]
    units.push({ name: shoradType, count: shoradCount })
  }

  return {
    objectiveId,
    units,
    position
  }
}

function chooseEmbeddedAirDefenseTypes(shoradTypes: string[]): string[] {
  if (shoradTypes.length === 0 || Math.random() >= EMBEDDED_AIR_DEFENSE_CHANCE) {
    return []
  }

  const missileTypes = shoradTypes.filter(isMissileAirDefense)
  const gunTypes = shoradTypes.filter((type) => !isMissileAirDefense(type))

  if (missileTypes.length > 0 && Math.random() < EMBEDDED_MISSILE_AIR_DEFENSE_CHANCE) {
    return missileTypes
  }

  if (gunTypes.length > 0) return gunTypes
  return []
}

function isMissileAirDefense(unitType: string): boolean {
  return /\b(linebacker|stinger|igla|avenger|chaparral|osa|tunguska|tor|strela|roland|rapier|hq-7)\b/i.test(
    unitType
  )
}
