import { schemas } from '@dcc/contracts'
import { scenarios, theatres } from '@dcc/data'
import * as z from 'zod'
import { calculateDistance } from '@/logic/utils/calculate-distance'
import { logCombatAction } from '@/logic/simulation-log'
import { updateCampaignGoal } from './campaign-goal'
import {
  getAirdromePosition,
  isAirdromeVulnerable,
  transferAirdromeOwnership
} from './airport-capture'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type GroundGroup = z.infer<typeof schemas.groundGroup>
type SupplyStatus = z.infer<typeof schemas.supplyStatus>

const INFANTRY_SPEED = 4 // m/s (~14 km/h)
const VEHICLE_SPEED = 12 // m/s (~43 km/h)
const CAPTURE_DISTANCE = 2000 // meters
const BATTLE_RADIUS = 5000 // meters
const BASE_ATTRITION_PER_SECOND = 0.4
const DEFENDER_BONUS = 1.2
const MIN_TACTICAL_ADVANTAGE = 1.2
const MAX_TACTICAL_ADVANTAGE = 1.4

type BattleSide = 'attacker' | 'defender'

function getRandomTacticalAdvantage(): { side: BattleSide; multiplier: number } {
  return {
    side: Math.random() < 0.5 ? 'attacker' : 'defender',
    multiplier:
      MIN_TACTICAL_ADVANTAGE + Math.random() * (MAX_TACTICAL_ADVANTAGE - MIN_TACTICAL_ADVANTAGE)
  }
}

function isInfantryGroup(units: { name: string; count: number }[]): boolean {
  return units.every((u) => /infantry|soldier/i.test(u.name))
}

function isInfantryUnit(name: string): boolean {
  return /infantry|soldier|rifle|manpad/i.test(name)
}

function getUnitWeight(name: string): number {
  if (isInfantryUnit(name)) return 1
  if (/shorad|aaa|sam/i.test(name)) return 2
  return 3
}

function getUnitCount(group: GroundGroup): number {
  return group.units.reduce((sum, unit) => sum + unit.count, 0)
}

function getTotalUnitCount(groups: GroundGroup[]): number {
  return groups.reduce((sum, group) => sum + getUnitCount(group), 0)
}

function getGroupPower(group: GroundGroup): number {
  return group.units.reduce((sum, unit) => sum + unit.count * getUnitWeight(unit.name), 0)
}

function getSupplyCombatMultiplier(status: SupplyStatus | undefined): number {
  switch (status) {
    case 'abundant':
      return 1.1
    case 'adequate':
      return 1.0
    case 'low':
      return 0.8
    case 'critical':
      return 0.6
    case 'depleted':
      return 0.35
    default:
      return 1.0
  }
}

function clearCombatState(group: GroundGroup): void {
  if (group.state === 'combat') {
    group.state = 'moving'
  }
  group.combatStartedAt = undefined
  group.initialStrength = undefined
}

function clearCaptureState(group: GroundGroup): void {
  group.captureStartedAt = undefined
}

function clearTargetState(group: GroundGroup): void {
  group.targetObjectiveId = undefined
  group.targetAirdromeName = undefined
}

function setCombatState(group: GroundGroup, nowIso: string): void {
  group.state = 'combat'
  group.combatStartedAt = group.combatStartedAt ?? nowIso
  group.initialStrength = group.initialStrength ?? getUnitCount(group)
}

function moveGroupTowardsObjective(
  group: GroundGroup,
  targetPosition: z.infer<typeof schemas.position>,
  delta: number,
  timeMultiplier: number
): void {
  const distance = calculateDistance(group.position, targetPosition)
  if (distance === 0) return

  const campaignDeltaS = (delta * timeMultiplier) / 1000
  const speed = isInfantryGroup(group.units) ? INFANTRY_SPEED : VEHICLE_SPEED
  const ratio = Math.min((speed * campaignDeltaS) / distance, 1)
  const dx = targetPosition.x - group.position.x
  const dy = targetPosition.y - group.position.y

  group.position.x += dx * ratio
  group.position.y += dy * ratio
}

function applyCasualties(
  group: GroundGroup,
  expectedLosses: number,
  maxCasualties = Infinity
): number {
  if (expectedLosses <= 0 || group.units.length === 0) return 0

  let casualties = Math.floor(expectedLosses)
  if (Math.random() < expectedLosses - casualties) {
    casualties += 1
  }
  casualties = Math.min(casualties, maxCasualties)
  if (casualties <= 0) return 0

  let applied = 0
  while (casualties > 0 && group.units.length > 0) {
    let maxIdx = 0
    for (let i = 1; i < group.units.length; i++) {
      if (group.units[i]!.count > group.units[maxIdx]!.count) {
        maxIdx = i
      }
    }

    const unit = group.units[maxIdx]
    if (!unit || unit.count <= 0) break

    unit.count -= 1
    casualties -= 1
    applied += 1

    if (unit.count <= 0) {
      group.units.splice(maxIdx, 1)
    }
  }

  return applied
}

function distributeCasualties(
  groups: GroundGroup[],
  expectedLosses: number,
  preserveOneUnit = false
): number {
  if (expectedLosses <= 0 || groups.length === 0) return 0

  const powers = groups.map((group) => Math.max(getGroupPower(group), 1))
  const totalPower = powers.reduce((sum, power) => sum + power, 0)
  if (totalPower <= 0) return 0

  let remainingCasualtyLimit = preserveOneUnit
    ? Math.max(0, groups.reduce((sum, group) => sum + getUnitCount(group), 0) - 1)
    : Number.POSITIVE_INFINITY

  let totalApplied = 0
  groups.forEach((group, idx) => {
    if (remainingCasualtyLimit <= 0) return

    const groupExpectedLosses = expectedLosses * (powers[idx]! / totalPower)
    const applied = applyCasualties(group, groupExpectedLosses, remainingCasualtyLimit)
    totalApplied += applied
    remainingCasualtyLimit -= applied
  })
  return totalApplied
}

function cleanupDestroyedGroups(draft: Campaign, coalition: Coalition): void {
  draft.coalitions[coalition].groundGroups = draft.coalitions[coalition].groundGroups.filter(
    (group) => getUnitCount(group) > 0
  )
}

function getCombatPower(
  draft: Campaign,
  coalition: Coalition,
  groups: GroundGroup[],
  fallbackObjectiveId: string,
  defenderSide: boolean
): number {
  const supplyNodes = draft.coalitions[coalition].supplyNodes

  return groups.reduce((sum, group) => {
    const supplyObjectiveId = group.objectiveId ?? fallbackObjectiveId
    const supplyStatus = supplyNodes?.[supplyObjectiveId]?.status
    const supplyMultiplier = getSupplyCombatMultiplier(supplyStatus)
    const defenderMultiplier = defenderSide ? DEFENDER_BONUS : 1
    return sum + getGroupPower(group) * supplyMultiplier * defenderMultiplier
  }, 0)
}

function resolveObjectiveBattle(
  draft: Campaign,
  coalition: Coalition,
  enemyCoalition: Coalition,
  theatre: z.infer<typeof schemas.theatre>,
  targetObjectiveId: string,
  delta: number
): void {
  const targetObjective = theatre.objectives.find(
    (objective) => objective.name === targetObjectiveId
  )
  if (!targetObjective) return

  const nowIso = draft.time.toISOString()
  const enemyObjectiveIds = draft.coalitions[enemyCoalition].objectiveIds
  const ownGroundGroups = draft.coalitions[coalition].groundGroups

  const attackers = ownGroundGroups.filter(
    (group) => group.targetObjectiveId === targetObjectiveId && group.state !== 'idle'
  )
  if (attackers.length === 0) return

  if (!enemyObjectiveIds.includes(targetObjectiveId)) {
    for (const attacker of attackers) {
      clearCombatState(attacker)
      clearCaptureState(attacker)
      attacker.state = 'idle'
      clearTargetState(attacker)
    }
    return
  }

  const nearestAttackerDistance = Math.min(
    ...attackers.map((attacker) => calculateDistance(attacker.position, targetObjective.position))
  )

  const defendersInRange = draft.coalitions[enemyCoalition].groundGroups.filter(
    (group) =>
      getUnitCount(group) > 0 &&
      calculateDistance(group.position, targetObjective.position) <= BATTLE_RADIUS
  )

  if (defendersInRange.length > 0 && nearestAttackerDistance <= BATTLE_RADIUS) {
    const enteringCombatCount =
      attackers.filter((attacker) => attacker.state !== 'combat').length +
      defendersInRange.filter((defender) => defender.state !== 'combat').length

    attackers.forEach((attacker) => {
      setCombatState(attacker, nowIso)
      clearCaptureState(attacker)
    })
    defendersInRange.forEach((defender) => setCombatState(defender, nowIso))

    if (enteringCombatCount > 0) {
      const primaryAttacker = attackers[0]
      logCombatAction(
        draft,
        coalition,
        `Ground battle started at ${targetObjectiveId} (${attackers.length} attackers vs ${defendersInRange.length} defenders)`,
        undefined,
        primaryAttacker
          ? {
              entityType: 'groundGroup',
              entityId: primaryAttacker.id
            }
          : undefined
      )
    }

    const deltaS = (delta * draft.timeMultiplier) / 1000
    const tacticalAdvantage = getRandomTacticalAdvantage()
    const attackerPower =
      getCombatPower(draft, coalition, attackers, targetObjectiveId, false) *
      (tacticalAdvantage.side === 'attacker' ? tacticalAdvantage.multiplier : 1)
    const defenderPower =
      getCombatPower(draft, enemyCoalition, defendersInRange, targetObjectiveId, true) *
      (tacticalAdvantage.side === 'defender' ? tacticalAdvantage.multiplier : 1)

    const expectedAttackerLosses = BASE_ATTRITION_PER_SECOND * deltaS * (defenderPower / 10)
    const expectedDefenderLosses = BASE_ATTRITION_PER_SECOND * deltaS * (attackerPower / 10)
    const mutualDestructionPossible =
      Math.ceil(expectedAttackerLosses) >= getTotalUnitCount(attackers) &&
      Math.ceil(expectedDefenderLosses) >= getTotalUnitCount(defendersInRange)

    const attackerCasualties = distributeCasualties(
      attackers,
      expectedAttackerLosses,
      mutualDestructionPossible && tacticalAdvantage.side === 'attacker'
    )
    const defenderCasualties = distributeCasualties(
      defendersInRange,
      expectedDefenderLosses,
      mutualDestructionPossible && tacticalAdvantage.side === 'defender'
    )

    if (attackerCasualties > 0 || defenderCasualties > 0) {
      const primaryAttacker = attackers[0]
      logCombatAction(
        draft,
        coalition,
        `Ground combat at ${targetObjectiveId}: losses ${coalition}=${attackerCasualties}, ${enemyCoalition}=${defenderCasualties}`,
        undefined,
        primaryAttacker
          ? {
              entityType: 'groundGroup',
              entityId: primaryAttacker.id
            }
          : undefined
      )
    }

    cleanupDestroyedGroups(draft, coalition)
    cleanupDestroyedGroups(draft, enemyCoalition)

    return
  }

  for (const attacker of attackers) {
    clearCombatState(attacker)
  }

  if (nearestAttackerDistance > CAPTURE_DISTANCE) {
    for (const attacker of attackers) {
      clearCaptureState(attacker)
    }
    return
  }

  let nearestAttacker: GroundGroup | undefined
  let nearestDistance = Number.POSITIVE_INFINITY
  for (const attacker of attackers) {
    const distance = calculateDistance(attacker.position, targetObjective.position)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestAttacker = attacker
    }
  }
  if (!nearestAttacker) return

  for (const attacker of attackers) {
    if (attacker.id !== nearestAttacker.id) {
      clearCaptureState(attacker)
    }
  }

  const enemyObjectiveIndex = enemyObjectiveIds.indexOf(targetObjectiveId)
  if (enemyObjectiveIndex !== -1) {
    enemyObjectiveIds.splice(enemyObjectiveIndex, 1)
  }
  draft.coalitions[coalition].objectiveIds.push(targetObjectiveId)
  logCombatAction(draft, coalition, `Objective captured: ${targetObjectiveId}`)
  updateCampaignGoal(draft)

  draft.coalitions[enemyCoalition].structures = draft.coalitions[enemyCoalition].structures.filter(
    (structure) => structure.objectiveId !== targetObjectiveId
  )

  draft.coalitions[enemyCoalition].samGroups = draft.coalitions[enemyCoalition].samGroups.filter(
    (samGroup) => samGroup.objectiveId !== targetObjectiveId
  )

  draft.coalitions[enemyCoalition].groundGroups = draft.coalitions[
    enemyCoalition
  ].groundGroups.filter(
    (group) => !(group.objectiveId === targetObjectiveId && group.state === 'idle')
  )

  // All attackers targeting this objective become defenders (including the capturing group)
  for (const attacker of draft.coalitions[coalition].groundGroups) {
    if (attacker.targetObjectiveId !== targetObjectiveId) continue
    clearCombatState(attacker)
    clearCaptureState(attacker)
    attacker.state = 'idle'
    attacker.objectiveId = targetObjectiveId
    clearTargetState(attacker)
  }
}

function resolveAirdromeBattle(
  draft: Campaign,
  coalition: Coalition,
  enemyCoalition: Coalition,
  theatre: z.infer<typeof schemas.theatre>,
  targetAirdromeName: string,
  delta: number
): void {
  const targetPosition = getAirdromePosition(theatre, targetAirdromeName)
  if (!targetPosition) return

  const enemyAirdromeNames = draft.coalitions[enemyCoalition].airdromeNames
  const ownGroundGroups = draft.coalitions[coalition].groundGroups

  const attackers = ownGroundGroups.filter(
    (group) => group.targetAirdromeName === targetAirdromeName && group.state !== 'idle'
  )
  if (attackers.length === 0) return

  if (!enemyAirdromeNames.includes(targetAirdromeName)) {
    for (const attacker of attackers) {
      clearCombatState(attacker)
      clearCaptureState(attacker)
      attacker.state = 'idle'
      clearTargetState(attacker)
    }
    return
  }

  if (!isAirdromeVulnerable(draft, theatre, coalition, targetAirdromeName)) {
    for (const attacker of attackers) {
      clearCombatState(attacker)
      clearCaptureState(attacker)
    }
    return
  }

  const nowIso = draft.time.toISOString()
  const nearestAttackerDistance = Math.min(
    ...attackers.map((attacker) => calculateDistance(attacker.position, targetPosition))
  )

  const defendersInRange = draft.coalitions[enemyCoalition].groundGroups.filter(
    (group) =>
      getUnitCount(group) > 0 && calculateDistance(group.position, targetPosition) <= BATTLE_RADIUS
  )

  if (defendersInRange.length > 0 && nearestAttackerDistance <= BATTLE_RADIUS) {
    const enteringCombatCount =
      attackers.filter((attacker) => attacker.state !== 'combat').length +
      defendersInRange.filter((defender) => defender.state !== 'combat').length

    attackers.forEach((attacker) => {
      setCombatState(attacker, nowIso)
      clearCaptureState(attacker)
    })
    defendersInRange.forEach((defender) => setCombatState(defender, nowIso))

    if (enteringCombatCount > 0) {
      const primaryAttacker = attackers[0]
      logCombatAction(
        draft,
        coalition,
        `Ground battle started at airport ${targetAirdromeName} (${attackers.length} attackers vs ${defendersInRange.length} defenders)`,
        undefined,
        primaryAttacker
          ? {
              entityType: 'groundGroup',
              entityId: primaryAttacker.id
            }
          : undefined
      )
    }

    const deltaS = (delta * draft.timeMultiplier) / 1000
    const tacticalAdvantage = getRandomTacticalAdvantage()
    const attackerPower =
      getCombatPower(draft, coalition, attackers, targetAirdromeName, false) *
      (tacticalAdvantage.side === 'attacker' ? tacticalAdvantage.multiplier : 1)
    const defenderPower =
      getCombatPower(draft, enemyCoalition, defendersInRange, targetAirdromeName, true) *
      (tacticalAdvantage.side === 'defender' ? tacticalAdvantage.multiplier : 1)

    const expectedAttackerLosses = BASE_ATTRITION_PER_SECOND * deltaS * (defenderPower / 10)
    const expectedDefenderLosses = BASE_ATTRITION_PER_SECOND * deltaS * (attackerPower / 10)
    const mutualDestructionPossible =
      Math.ceil(expectedAttackerLosses) >= getTotalUnitCount(attackers) &&
      Math.ceil(expectedDefenderLosses) >= getTotalUnitCount(defendersInRange)

    const attackerCasualties = distributeCasualties(
      attackers,
      expectedAttackerLosses,
      mutualDestructionPossible && tacticalAdvantage.side === 'attacker'
    )
    const defenderCasualties = distributeCasualties(
      defendersInRange,
      expectedDefenderLosses,
      mutualDestructionPossible && tacticalAdvantage.side === 'defender'
    )

    if (attackerCasualties > 0 || defenderCasualties > 0) {
      const primaryAttacker = attackers[0]
      logCombatAction(
        draft,
        coalition,
        `Ground combat at airport ${targetAirdromeName}: losses ${coalition}=${attackerCasualties}, ${enemyCoalition}=${defenderCasualties}`,
        undefined,
        primaryAttacker
          ? {
              entityType: 'groundGroup',
              entityId: primaryAttacker.id
            }
          : undefined
      )
    }

    cleanupDestroyedGroups(draft, coalition)
    cleanupDestroyedGroups(draft, enemyCoalition)

    return
  }

  for (const attacker of attackers) {
    clearCombatState(attacker)
  }

  if (nearestAttackerDistance > CAPTURE_DISTANCE) {
    for (const attacker of attackers) {
      clearCaptureState(attacker)
    }
    return
  }

  transferAirdromeOwnership(draft, coalition, enemyCoalition, targetAirdromeName)
  logCombatAction(draft, coalition, `Airport captured: ${targetAirdromeName}`)

  draft.coalitions[enemyCoalition].groundGroups = draft.coalitions[
    enemyCoalition
  ].groundGroups.filter(
    (group) =>
      !(
        group.objectiveId === targetAirdromeName &&
        calculateDistance(group.position, targetPosition) <= BATTLE_RADIUS
      )
  )

  for (const attacker of draft.coalitions[coalition].groundGroups) {
    if (attacker.targetAirdromeName !== targetAirdromeName) continue
    clearCombatState(attacker)
    clearCaptureState(attacker)
    attacker.state = 'idle'
    attacker.objectiveId = targetAirdromeName
    attacker.position = targetPosition
    clearTargetState(attacker)
  }
}

function processObjectiveBattlesAndCaptures(
  draft: Campaign,
  coalition: Coalition,
  enemyCoalition: Coalition,
  theatre: z.infer<typeof schemas.theatre>,
  delta: number
): void {
  const targetObjectiveIds = Array.from(
    new Set(
      draft.coalitions[coalition].groundGroups
        .map((group) => {
          if (group.state === 'idle') return undefined
          return group.targetObjectiveId
        })
        .filter((targetObjectiveId): targetObjectiveId is string => targetObjectiveId != null)
    )
  )

  for (const targetObjectiveId of targetObjectiveIds) {
    resolveObjectiveBattle(draft, coalition, enemyCoalition, theatre, targetObjectiveId, delta)
  }

  const targetAirdromeNames = Array.from(
    new Set(
      draft.coalitions[coalition].groundGroups
        .map((group) => {
          if (group.state === 'idle') return undefined
          return group.targetAirdromeName
        })
        .filter((targetAirdromeName): targetAirdromeName is string => targetAirdromeName != null)
    )
  )

  for (const targetAirdromeName of targetAirdromeNames) {
    resolveAirdromeBattle(draft, coalition, enemyCoalition, theatre, targetAirdromeName, delta)
  }
}

type UpdateGroundGroupsOptions = {
  capture?: boolean
  move?: boolean
}

export function updateGroundGroups(
  draft: Campaign,
  coalition: Coalition,
  delta: number,
  options: UpdateGroundGroupsOptions = {}
): void {
  const scenario = scenarios.find((s) => s.id === draft.scenarioId)
  if (!scenario) return

  const theatre = theatres.find((t) => t.name === scenario.theatreName)
  if (!theatre) return

  const captureEnabled = options.capture ?? true
  const moveEnabled = options.move ?? true
  const enemyCoalition: Coalition = coalition === 'player' ? 'opponent' : 'player'
  if (captureEnabled && !moveEnabled) {
    processObjectiveBattlesAndCaptures(draft, coalition, enemyCoalition, theatre, delta)
  }

  const groundGroups = draft.coalitions[coalition].groundGroups
  const enemyObjectiveIds = draft.coalitions[enemyCoalition].objectiveIds
  const enemyAirdromeNames = draft.coalitions[enemyCoalition].airdromeNames

  for (const group of groundGroups) {
    if (group.state === 'idle') continue
    if (group.targetObjectiveId && group.targetAirdromeName) {
      group.targetAirdromeName = undefined
    }
    if (!group.targetObjectiveId && !group.targetAirdromeName) continue

    const targetPosition = group.targetObjectiveId
      ? theatre.objectives.find((objective) => objective.name === group.targetObjectiveId)?.position
      : group.targetAirdromeName
        ? getAirdromePosition(theatre, group.targetAirdromeName)
        : undefined

    if (!targetPosition) {
      clearCombatState(group)
      clearCaptureState(group)
      group.state = 'idle'
      clearTargetState(group)
      continue
    }

    if (group.targetObjectiveId && !enemyObjectiveIds.includes(group.targetObjectiveId)) {
      clearCombatState(group)
      clearCaptureState(group)
      group.state = 'idle'
      clearTargetState(group)
      continue
    }

    if (
      group.targetAirdromeName &&
      (!enemyAirdromeNames.includes(group.targetAirdromeName) ||
        !isAirdromeVulnerable(draft, theatre, coalition, group.targetAirdromeName))
    ) {
      clearCombatState(group)
      clearCaptureState(group)
      continue
    }

    if (group.state === 'combat') continue

    if (moveEnabled) {
      moveGroupTowardsObjective(group, targetPosition, delta, draft.timeMultiplier)
    }
  }
}
