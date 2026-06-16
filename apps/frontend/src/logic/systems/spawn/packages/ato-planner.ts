import { config, schemas } from '@dcc/contracts'
import { isSamFullyDestroyed, isSamOperational } from '@dcc/data'
import * as z from 'zod'

import { CapFlightGroup } from '../../../entities/cap-flight-group'
import { DeadFlightGroup } from '../../../entities/dead-flight-group'
import { SeadFlightGroup } from '../../../entities/sead-flight-group'
import { StrikeFlightGroup } from '../../../entities/strike-flight-group'
import { TransportFlightGroup } from '../../../entities/transport-flight-group'
import {
  buildCasMissionWaypoints,
  spawnPlannedFlightGroup
} from '../../../entities/flight-group-spawn'
import { getObjectivePosition } from '@/logic/utils/get-objective-position'
import { getClosestThreateningSam } from '@/logic/utils/threat-analyzer'
import { calculateDistance } from '@/logic/utils/calculate-distance'
import {
  getCoalitionAirdromes,
  pickRandomAircraftType,
  selectCapPatrolAssignment,
  selectHomeBaseAndTarget,
  type AirdromeSelection,
  type SpawnContext
} from './common'
import {
  ensureVirtualSupply,
  getFlightLogisticsCost,
  getNodeSupply,
  spendFlightLogistics
} from '../../update-supply'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type Position = z.infer<typeof schemas.position>
type AircraftName = z.infer<typeof schemas.dcs.aircraftName>
type FlightTask = z.infer<typeof schemas.flightGroup>['task']
type MissionPackage = z.infer<typeof schemas.missionPackage>
type PackageMemberRole = z.infer<typeof schemas.packageMemberRole>

export type AtoPackageKind = 'cap' | 'strike' | 'strategicStrike' | 'dead' | 'cas' | 'transport'

export type AtoRejectionReason =
  | 'budget exhausted'
  | 'cooldown active'
  | 'duplicate target'
  | 'no aircraft'
  | 'no source'
  | 'no target'
  | 'out of range'
  | 'supply blocked'

type FlightPlanDescriptor = {
  role: PackageMemberRole
  task: FlightTask
  aircraftType: AircraftName
  homeBase: AirdromeSelection
  targetPosition: Position
  target?: NonNullable<z.infer<typeof schemas.flightGroup>['target']> & {
    position?: Position
    buildings?: z.infer<typeof schemas.structureBuilding>[]
  }
  patrolCenter?: Position
  tot?: Date
  transport?: {
    sourceNode: string
    destinationNode: string
    destinationPosition: Position
    cargoAmount: number
    transportType: 'strategic' | 'tactical' | 'emergency'
  }
}

export type AtoPackagePlan = {
  id: string
  kind: AtoPackageKind
  type: MissionPackage['type']
  coalition: Coalition
  priority: number
  reason: string
  targetId: string
  targetObjectiveId: string
  targetType: string
  tot: Date
  flights: FlightPlanDescriptor[]
}

export type RejectedAtoPackage = {
  kind: AtoPackageKind
  reason: AtoRejectionReason
  targetId?: string
  detail?: string
}

export type AtoPlannerPolicy = {
  maxNewPackagesPerLogicTick: number
  maxActivePackages: number
  maxActiveAircraft: number
  packageLookaheadMs: number
  enableTransport: boolean
}

export type AtoPlannerResult = {
  admitted: AtoPackagePlan[]
  candidates: AtoPackagePlan[]
  rejected: RejectedAtoPackage[]
}

export const defaultAtoPlannerPolicy: AtoPlannerPolicy = {
  maxNewPackagesPerLogicTick: 2,
  maxActivePackages: 8,
  maxActiveAircraft: 28,
  packageLookaheadMs: 90 * 60 * 1000,
  enableTransport: false
}

function hasAircraft(draft: Campaign, coalition: Coalition, task: FlightTask) {
  return (draft.coalitions[coalition].aircraftTypes[task] ?? []).length > 0
}

function pickAircraft(draft: Campaign, coalition: Coalition, task: FlightTask) {
  return pickRandomAircraftType(draft.coalitions[coalition].aircraftTypes[task] ?? [])
}

function activeTaskCount(draft: Campaign, coalition: Coalition, task: FlightTask) {
  return draft.coalitions[coalition].flightGroups.filter((group) => group.task === task).length
}

function activeAircraftCount(draft: Campaign, coalition: Coalition) {
  return draft.coalitions[coalition].flightGroups.reduce(
    (sum, group) => sum + group.aircrafts.length,
    0
  )
}

function getFlightAircraftCount(flight: FlightPlanDescriptor) {
  if (flight.task === 'Strategic Strike') {
    return config.packages['Strategic Strike'].maxAircraftsPerGroup
  }
  return config.packages[flight.task as keyof typeof config.packages]?.aircraftsPerGroup ?? 1
}

function getPlanAircraftCount(plan: AtoPackagePlan) {
  return plan.flights.reduce((sum, flight) => sum + getFlightAircraftCount(flight), 0)
}

function isTargetAlreadyAssigned(draft: Campaign, coalition: Coalition, targetId: string) {
  return draft.coalitions[coalition].flightGroups.some((group) => group.target?.id === targetId)
}

function collectExistingPackageTargetIds(draft: Campaign, coalition: Coalition) {
  return new Set(
    draft.coalitions[coalition].flightGroups
      .map((group) => group.target?.id)
      .filter((id): id is string => id != null)
  )
}

function activeAutomaticCapHomeBases(draft: Campaign, coalition: Coalition) {
  return new Set(
    draft.coalitions[coalition].flightGroups
      .filter((group) => group.task === 'CAP' && group.spawnSource !== 'manual')
      .map((group) => group.homeBase)
  )
}

function createPlanId(kind: AtoPackageKind, targetId: string) {
  return `planned-${kind}-${targetId}`
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function getSupplySpawnModifier(draft: Campaign, coalition: Coalition, airbaseName: string) {
  const supply = getNodeSupply(draft, coalition, airbaseName)
  if (!supply) return 1

  switch (supply.status) {
    case 'abundant':
    case 'adequate':
    case 'low':
      return 1
    case 'critical':
      return 0.5
    case 'depleted':
      return 0
  }
}

function isAirbaseSupplyBlocked(draft: Campaign, coalition: Coalition, airbaseName: string) {
  return getSupplySpawnModifier(draft, coalition, airbaseName) <= 0
}

type LogisticsBudget = {
  supply: number
  fuel: number
  munitions: number
  repair: number
}

function getFlightLogisticsBudget(flight: FlightPlanDescriptor): LogisticsBudget {
  const aircraftCount = getFlightAircraftCount(flight)
  return getFlightLogisticsCost(flight.task, aircraftCount)
}

function getAirbaseLogisticsBudget(
  draft: Campaign,
  coalition: Coalition,
  airbaseName: string,
  remainingByAirbase: Map<string, LogisticsBudget>
): LogisticsBudget | null {
  const cached = remainingByAirbase.get(airbaseName)
  if (cached) return cached

  const supply = getNodeSupply(draft, coalition, airbaseName)
  if (!supply) return null

  ensureVirtualSupply(supply, draft.coalitions[coalition].airdromeNames.includes(airbaseName))
  const budget = {
    supply: supply.current,
    fuel: supply.fuel?.current ?? 0,
    munitions: supply.munitions?.current ?? 0,
    repair: supply.repair?.current ?? 0
  }
  remainingByAirbase.set(airbaseName, budget)
  return budget
}

function reservePlanLogistics(
  draft: Campaign,
  coalition: Coalition,
  plan: AtoPackagePlan,
  remainingByAirbase: Map<string, LogisticsBudget>
): boolean {
  const reservations: Array<{ budget: LogisticsBudget; cost: LogisticsBudget }> = []

  for (const flight of plan.flights) {
    const budget = getAirbaseLogisticsBudget(
      draft,
      coalition,
      flight.homeBase.name,
      remainingByAirbase
    )
    if (!budget) continue

    const cost = getFlightLogisticsBudget(flight)
    if (
      budget.supply < cost.supply ||
      budget.fuel < cost.fuel ||
      budget.munitions < cost.munitions ||
      budget.repair < cost.repair
    ) {
      return false
    }
    reservations.push({ budget, cost })
  }

  for (const reservation of reservations) {
    reservation.budget.supply -= reservation.cost.supply
    reservation.budget.fuel -= reservation.cost.fuel
    reservation.budget.munitions -= reservation.cost.munitions
    reservation.budget.repair -= reservation.cost.repair
  }

  return true
}

function pushRejection(
  rejected: RejectedAtoPackage[],
  kind: AtoPackageKind,
  reason: AtoRejectionReason,
  targetId?: string,
  detail?: string
) {
  rejected.push({ kind, reason, targetId, detail })
}

function makeCapPlan(
  draft: Campaign,
  coalition: Coalition,
  context: SpawnContext,
  rejected: RejectedAtoPackage[]
): AtoPackagePlan | null {
  if (activeTaskCount(draft, coalition, 'CAP') >= config.packages.CAP.maxActive[coalition]) {
    pushRejection(rejected, 'cap', 'budget exhausted')
    return null
  }
  if (!hasAircraft(draft, coalition, 'CAP')) {
    pushRejection(rejected, 'cap', 'no aircraft')
    return null
  }

  const homeBases = getCoalitionAirdromes(draft, context.theatre, coalition)
  const enemyAirdromes = getCoalitionAirdromes(draft, context.theatre, context.enemyCoalition)
  const assignment = selectCapPatrolAssignment({
    homeBases,
    enemyAirdromes,
    coveredHomeBases: activeAutomaticCapHomeBases(draft, coalition),
    maxHomeToEnemyDistance: config.packages.CAP.maxDistance * 2
  })
  if (!assignment) {
    pushRejection(rejected, 'cap', 'no target')
    return null
  }
  if (isAirbaseSupplyBlocked(draft, coalition, assignment.homeBase.name)) {
    pushRejection(rejected, 'cap', 'supply blocked', assignment.homeBase.name)
    return null
  }

  const aircraftType = pickAircraft(draft, coalition, 'CAP')
  if (!aircraftType) {
    pushRejection(rejected, 'cap', 'no aircraft')
    return null
  }

  const targetId = assignment.homeBase.name
  const tot = addMinutes(draft.time, 20)
  return {
    id: createPlanId('cap', targetId),
    kind: 'cap',
    type: 'CAP Package',
    coalition,
    priority: 70,
    reason: 'Uncovered CAP lane',
    targetId,
    targetObjectiveId: targetId,
    targetType: 'airspace',
    tot,
    flights: [
      {
        role: 'cap',
        task: 'CAP',
        aircraftType,
        homeBase: assignment.homeBase,
        targetPosition: assignment.patrolCenter,
        patrolCenter: assignment.patrolCenter
      }
    ]
  }
}

function makeStrikePlan(
  draft: Campaign,
  coalition: Coalition,
  context: SpawnContext,
  task: 'Pinpoint Strike' | 'Strategic Strike',
  rejected: RejectedAtoPackage[]
): AtoPackagePlan | null {
  const kind: AtoPackageKind = task === 'Strategic Strike' ? 'strategicStrike' : 'strike'
  if (task === 'Strategic Strike' && coalition !== 'opponent') return null
  if (activeTaskCount(draft, coalition, task) >= config.packages[task].maxActive[coalition]) {
    pushRejection(rejected, kind, 'budget exhausted')
    return null
  }
  if (!hasAircraft(draft, coalition, task)) {
    pushRejection(rejected, kind, 'no aircraft')
    return null
  }

  const cooldownUntil = draft.coalitions[coalition].strategicStrikeCooldownUntil
  if (task === 'Strategic Strike' && cooldownUntil && draft.time < cooldownUntil) {
    pushRejection(rejected, kind, 'cooldown active', undefined, cooldownUntil.toISOString())
    return null
  }

  const homeBases = getCoalitionAirdromes(draft, context.theatre, coalition)
  const targets = draft.coalitions[context.enemyCoalition].structures
    .filter((structure) => !isTargetAlreadyAssigned(draft, coalition, structure.id))
    .map((structure) => {
      const position = getObjectivePosition(context.theatre, structure.objectiveId)
      return position
        ? {
            target: {
              id: structure.id,
              type: structure.type,
              objectiveId: structure.objectiveId,
              position: structure.position,
              buildings: structure.buildings
            },
            position
          }
        : null
    })
    .filter((target): target is NonNullable<typeof target> => target != null)

  if (targets.length === 0) {
    pushRejection(rejected, kind, 'no target')
    return null
  }

  const assignment = selectHomeBaseAndTarget({
    homeBases,
    targets,
    maxDistance: config.packages[task].maxDistance,
    preference: task === 'Strategic Strike' ? 'farthest' : 'nearest'
  })
  if (!assignment) {
    pushRejection(rejected, kind, 'out of range')
    return null
  }
  if (isAirbaseSupplyBlocked(draft, coalition, assignment.homeBase.name)) {
    pushRejection(rejected, kind, 'supply blocked', assignment.homeBase.name)
    return null
  }

  const aircraftType = pickAircraft(draft, coalition, task)
  if (!aircraftType) {
    pushRejection(rejected, kind, 'no aircraft')
    return null
  }

  const flights: FlightPlanDescriptor[] = [
    {
      role: 'primary',
      task,
      aircraftType,
      homeBase: assignment.homeBase,
      target: assignment.target,
      targetPosition: assignment.targetPosition
    }
  ]

  const threateningSam = getClosestThreateningSam(
    assignment.targetPosition,
    draft.coalitions[context.enemyCoalition].samGroups,
    context.theatre,
    draft,
    context.enemyCoalition
  )
  const canAddSead =
    threateningSam != null &&
    hasAircraft(draft, coalition, 'SEAD') &&
    activeTaskCount(draft, coalition, 'SEAD') < config.packages.SEAD.maxActive[coalition]

  if (threateningSam && canAddSead) {
    const seadAircraftType = pickAircraft(draft, coalition, 'SEAD')
    if (seadAircraftType) {
      flights.push({
        role: 'sead',
        task: 'SEAD',
        aircraftType: seadAircraftType,
        homeBase: assignment.homeBase,
        target: {
          id: threateningSam.samGroup.id,
          type: threateningSam.samGroup.type,
          objectiveId: threateningSam.samGroup.objectiveId
        },
        targetPosition: threateningSam.position
      })
    }
  }

  const tot = addMinutes(draft.time, task === 'Strategic Strike' ? 50 : 40)
  return {
    id: createPlanId(kind, assignment.target.id),
    kind,
    type:
      task === 'Strategic Strike' && flights.some((flight) => flight.task === 'SEAD')
        ? 'SEAD Strategic Strike Package'
        : flights.some((flight) => flight.task === 'SEAD')
          ? 'SEAD Strike Package'
          : 'Strike Package',
    coalition,
    priority:
      (task === 'Strategic Strike' ? 55 : 65) +
      (flights.some((flight) => flight.task === 'SEAD') ? 10 : 0),
    reason: flights.some((flight) => flight.task === 'SEAD')
      ? 'Strike target covered by SAM'
      : 'Reachable strike target',
    targetId: assignment.target.id,
    targetObjectiveId: assignment.target.objectiveId,
    targetType: assignment.target.type,
    tot,
    flights
  }
}

function makeDeadPlan(
  draft: Campaign,
  coalition: Coalition,
  context: SpawnContext,
  rejected: RejectedAtoPackage[]
): AtoPackagePlan | null {
  if (activeTaskCount(draft, coalition, 'DEAD') >= config.packages.DEAD.maxActive[coalition]) {
    pushRejection(rejected, 'dead', 'budget exhausted')
    return null
  }
  if (!hasAircraft(draft, coalition, 'DEAD')) {
    pushRejection(rejected, 'dead', 'no aircraft')
    return null
  }

  const existingTargets = collectExistingPackageTargetIds(draft, coalition)
  const targets = draft.coalitions[context.enemyCoalition].samGroups
    .filter((sam) => !isSamFullyDestroyed(sam) && !existingTargets.has(sam.id))
    .map((sam) => {
      const position = getObjectivePosition(context.theatre, sam.objectiveId)
      return position
        ? {
            target: {
              id: sam.id,
              type: sam.type,
              objectiveId: sam.objectiveId
            },
            position,
            operational: isSamOperational(sam)
          }
        : null
    })
    .filter((target): target is NonNullable<typeof target> => target != null)
    .sort((a, b) => Number(b.operational) - Number(a.operational))

  if (targets.length === 0) {
    pushRejection(rejected, 'dead', 'no target')
    return null
  }

  const assignment = selectHomeBaseAndTarget({
    homeBases: getCoalitionAirdromes(draft, context.theatre, coalition),
    targets,
    maxDistance: config.packages.DEAD.maxDistance
  })
  if (!assignment) {
    pushRejection(rejected, 'dead', 'out of range')
    return null
  }
  if (isAirbaseSupplyBlocked(draft, coalition, assignment.homeBase.name)) {
    pushRejection(rejected, 'dead', 'supply blocked', assignment.homeBase.name)
    return null
  }

  const aircraftType = pickAircraft(draft, coalition, 'DEAD')
  if (!aircraftType) {
    pushRejection(rejected, 'dead', 'no aircraft')
    return null
  }

  return {
    id: createPlanId('dead', assignment.target.id),
    kind: 'dead',
    type: 'DEAD Package',
    coalition,
    priority: 60,
    reason: 'Untargeted SAM threat',
    targetId: assignment.target.id,
    targetObjectiveId: assignment.target.objectiveId,
    targetType: assignment.target.type,
    tot: addMinutes(draft.time, 40),
    flights: [
      {
        role: 'dead',
        task: 'DEAD',
        aircraftType,
        homeBase: assignment.homeBase,
        target: assignment.target,
        targetPosition: assignment.targetPosition
      }
    ]
  }
}

function makeCasPlan(
  draft: Campaign,
  coalition: Coalition,
  context: SpawnContext,
  rejected: RejectedAtoPackage[]
): AtoPackagePlan | null {
  if (activeTaskCount(draft, coalition, 'CAS') >= config.packages.CAS.maxActive[coalition]) {
    pushRejection(rejected, 'cas', 'budget exhausted')
    return null
  }
  if (!hasAircraft(draft, coalition, 'CAS')) {
    pushRejection(rejected, 'cas', 'no aircraft')
    return null
  }

  const existingTargets = collectExistingPackageTargetIds(draft, coalition)
  const targets = draft.coalitions[context.enemyCoalition].groundGroups
    .filter(
      (group) =>
        group.objectiveId != null &&
        group.state === 'idle' &&
        !existingTargets.has(group.id) &&
        getObjectivePosition(context.theatre, group.objectiveId) != null
    )
    .map((group) => ({
      target: {
        id: group.id,
        type: 'Ground Group',
        objectiveId: group.objectiveId!
      },
      position: group.position
    }))

  if (targets.length === 0) {
    pushRejection(rejected, 'cas', 'no target')
    return null
  }

  const assignment = selectHomeBaseAndTarget({
    homeBases: getCoalitionAirdromes(draft, context.theatre, coalition),
    targets,
    maxDistance: config.packages.CAS.maxDistance
  })
  if (!assignment) {
    pushRejection(rejected, 'cas', 'out of range')
    return null
  }
  if (isAirbaseSupplyBlocked(draft, coalition, assignment.homeBase.name)) {
    pushRejection(rejected, 'cas', 'supply blocked', assignment.homeBase.name)
    return null
  }

  const aircraftType = pickAircraft(draft, coalition, 'CAS')
  if (!aircraftType) {
    pushRejection(rejected, 'cas', 'no aircraft')
    return null
  }

  return {
    id: createPlanId('cas', assignment.target.id),
    kind: 'cas',
    type: 'CAS Package',
    coalition,
    priority: 58,
    reason: 'Enemy ground group near owned objective',
    targetId: assignment.target.id,
    targetObjectiveId: assignment.target.objectiveId,
    targetType: assignment.target.type,
    tot: addMinutes(draft.time, 35),
    flights: [
      {
        role: 'cas',
        task: 'CAS',
        aircraftType,
        homeBase: assignment.homeBase,
        target: assignment.target,
        targetPosition: assignment.targetPosition
      }
    ]
  }
}

type SupplyNode = {
  id: string
  type: 'airdrome' | 'objective'
  position: Position
  runwayAngle?: number
  urgency: number
  supply: z.infer<typeof schemas.supply>
}

function getSupplyNodesNeedingResupply(
  draft: Campaign,
  coalition: Coalition,
  context: SpawnContext
): SupplyNode[] {
  const supplyNodes = draft.coalitions[coalition].supplyNodes
  if (!supplyNodes) return []

  const nodes: SupplyNode[] = []
  for (const objectiveId of draft.coalitions[coalition].objectiveIds) {
    const supply = supplyNodes[objectiveId]
    const objective = context.theatre.objectives.find((entry) => entry.name === objectiveId)
    if (!supply || !objective || supply.status === 'abundant') continue
    nodes.push({
      id: objectiveId,
      type: 'objective',
      position: objective.position,
      urgency: 1 - supply.current / supply.max,
      supply
    })
  }

  for (const airdromeName of draft.coalitions[coalition].airdromeNames) {
    const supply = supplyNodes[airdromeName]
    const airdrome = context.theatre.airdromeDetails[airdromeName]
    if (!supply || !airdrome || supply.status === 'abundant') continue
    nodes.push({
      id: airdromeName,
      type: 'airdrome',
      position: { x: airdrome.x, y: airdrome.y },
      runwayAngle: airdrome.runwayAngle,
      urgency: 1 - supply.current / supply.max,
      supply
    })
  }

  return nodes.sort((a, b) => b.urgency - a.urgency)
}

function findSupplySource(
  draft: Campaign,
  coalition: Coalition,
  context: SpawnContext,
  destination: Position
): SupplyNode | null {
  const supplyNodes = draft.coalitions[coalition].supplyNodes
  if (!supplyNodes) return null

  let nearest: SupplyNode | null = null
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const airdromeName of draft.coalitions[coalition].airdromeNames) {
    const supply = supplyNodes[airdromeName]
    const airdrome = context.theatre.airdromeDetails[airdromeName]
    if (!supply || !airdrome || supply.current <= supply.max * 0.5) continue

    const position = { x: airdrome.x, y: airdrome.y }
    const distance = calculateDistance(position, destination)
    if (distance < nearestDistance && distance <= config.packages.Transport.maxDistance) {
      nearestDistance = distance
      nearest = {
        id: airdromeName,
        type: 'airdrome',
        position,
        runwayAngle: airdrome.runwayAngle,
        urgency: 0,
        supply
      }
    }
  }

  return nearest
}

function makeTransportPlan(
  draft: Campaign,
  coalition: Coalition,
  context: SpawnContext,
  rejected: RejectedAtoPackage[],
  policy: AtoPlannerPolicy
): AtoPackagePlan | null {
  if (!policy.enableTransport) return null
  if (
    activeTaskCount(draft, coalition, 'Transport') >= config.packages.Transport.maxActive[coalition]
  ) {
    pushRejection(rejected, 'transport', 'budget exhausted')
    return null
  }
  if (!hasAircraft(draft, coalition, 'Transport')) {
    pushRejection(rejected, 'transport', 'no aircraft')
    return null
  }

  const targetNode = getSupplyNodesNeedingResupply(draft, coalition, context)[0]
  if (!targetNode) {
    pushRejection(rejected, 'transport', 'no target')
    return null
  }

  const source = findSupplySource(draft, coalition, context, targetNode.position)
  if (!source) {
    pushRejection(rejected, 'transport', 'no source', targetNode.id)
    return null
  }

  const transportAircraft = draft.coalitions[coalition].aircraftTypes.Transport
  const preferredType = targetNode.supply.status === 'critical' ? 'CH-47D' : 'C-130'
  const aircraftType = transportAircraft.includes(preferredType)
    ? (preferredType as AircraftName)
    : pickAircraft(draft, coalition, 'Transport')
  if (!aircraftType) {
    pushRejection(rejected, 'transport', 'no aircraft')
    return null
  }

  const cargoCapacity =
    aircraftType === 'C-130'
      ? config.packages.Transport.c130CargoCapacity
      : config.packages.Transport.ch47CargoCapacity
  const cargoAmount = Math.min(cargoCapacity, targetNode.supply.max - targetNode.supply.current)
  if (cargoAmount <= 0) {
    pushRejection(rejected, 'transport', 'no target', targetNode.id)
    return null
  }

  const transportType =
    targetNode.supply.status === 'critical'
      ? 'emergency'
      : source.type === 'airdrome' && targetNode.type === 'airdrome'
        ? 'strategic'
        : 'tactical'

  return {
    id: createPlanId('transport', targetNode.id),
    kind: 'transport',
    type: 'Transport Package',
    coalition,
    priority: 45 + Math.round(targetNode.urgency * 30),
    reason: 'Supply node needs resupply',
    targetId: targetNode.id,
    targetObjectiveId: targetNode.id,
    targetType: 'supply',
    tot: addMinutes(draft.time, 25),
    flights: [
      {
        role: 'transport',
        task: 'Transport',
        aircraftType,
        homeBase: {
          name: source.id,
          position: source.position,
          runwayAngle: source.runwayAngle
        },
        targetPosition: targetNode.position,
        transport: {
          sourceNode: source.id,
          destinationNode: targetNode.id,
          destinationPosition: targetNode.position,
          cargoAmount,
          transportType
        }
      }
    ]
  }
}

function admitCandidates(
  draft: Campaign,
  coalition: Coalition,
  candidates: AtoPackagePlan[],
  rejected: RejectedAtoPackage[],
  policy: AtoPlannerPolicy
) {
  const admitted: AtoPackagePlan[] = []
  const activePackages = draft.coalitions[coalition].packages.filter(
    (pkg) => pkg.status === 'active'
  )
  let packageBudget = Math.max(0, policy.maxActivePackages - activePackages.length)
  let aircraftBudget = Math.max(0, policy.maxActiveAircraft - activeAircraftCount(draft, coalition))
  const admittedTargets = new Set<string>()
  const remainingLogisticsByAirbase = new Map<string, LogisticsBudget>()

  for (const candidate of candidates) {
    if (admitted.length >= policy.maxNewPackagesPerLogicTick || packageBudget <= 0) {
      pushRejection(rejected, candidate.kind, 'budget exhausted', candidate.targetId)
      continue
    }
    if (admittedTargets.has(candidate.targetId)) {
      pushRejection(rejected, candidate.kind, 'duplicate target', candidate.targetId)
      continue
    }

    const aircraftCount = getPlanAircraftCount(candidate)
    if (aircraftCount > aircraftBudget) {
      pushRejection(rejected, candidate.kind, 'budget exhausted', candidate.targetId)
      continue
    }
    if (!reservePlanLogistics(draft, coalition, candidate, remainingLogisticsByAirbase)) {
      pushRejection(rejected, candidate.kind, 'supply blocked', candidate.targetId)
      continue
    }

    admitted.push(candidate)
    admittedTargets.add(candidate.targetId)
    aircraftBudget -= aircraftCount
    packageBudget -= 1
  }

  return admitted
}

export function planAtoPackages(
  draft: Campaign,
  coalition: Coalition,
  context: SpawnContext,
  policy: AtoPlannerPolicy = defaultAtoPlannerPolicy
): AtoPlannerResult {
  const rejected: RejectedAtoPackage[] = []
  const candidates = [
    makeCapPlan(draft, coalition, context, rejected),
    makeStrikePlan(draft, coalition, context, 'Pinpoint Strike', rejected),
    makeStrikePlan(draft, coalition, context, 'Strategic Strike', rejected),
    makeDeadPlan(draft, coalition, context, rejected),
    makeCasPlan(draft, coalition, context, rejected),
    makeTransportPlan(draft, coalition, context, rejected, policy)
  ]
    .filter((plan): plan is AtoPackagePlan => plan != null)
    .sort((a, b) => b.priority - a.priority)

  return {
    candidates,
    admitted: admitCandidates(draft, coalition, candidates, rejected, policy),
    rejected
  }
}

function createMissionPackage(
  draft: Campaign,
  coalition: Coalition,
  plan: AtoPackagePlan,
  members: MissionPackage['members']
) {
  draft.coalitions[coalition].packages.push({
    id: plan.id,
    type: plan.type,
    targetObjectiveId: plan.targetObjectiveId,
    members,
    tot: plan.tot,
    originalTot: plan.tot,
    status: 'active',
    priority: plan.priority,
    reason: plan.reason,
    targetType: plan.targetType
  })
}

function commitFlight(
  draft: Campaign,
  coalition: Coalition,
  plan: AtoPackagePlan,
  flight: FlightPlanDescriptor
) {
  const spendHomeBaseLogistics = () => {
    const supply = getNodeSupply(draft, coalition, flight.homeBase.name)
    spendFlightLogistics(supply, flight.task, getFlightAircraftCount(flight))
  }

  if (flight.task === 'CAP' && flight.patrolCenter) {
    const flightGroupId = CapFlightGroup.spawn(draft, coalition, {
      homeBase: flight.homeBase.name,
      homeBasePosition: flight.homeBase.position,
      patrolCenter: flight.patrolCenter,
      runwayAngle: flight.homeBase.runwayAngle,
      aircraftType: flight.aircraftType,
      packageId: plan.id
    }).flightGroupId
    spendHomeBaseLogistics()
    return flightGroupId
  }

  if ((flight.task === 'Pinpoint Strike' || flight.task === 'Strategic Strike') && flight.target) {
    const flightGroupId = StrikeFlightGroup.spawn(draft, coalition, {
      homeBase: flight.homeBase.name,
      homeBasePosition: flight.homeBase.position,
      target: flight.target,
      targetPosition: flight.targetPosition,
      runwayAngle: flight.homeBase.runwayAngle,
      aircraftType: flight.aircraftType,
      packageId: plan.id,
      exactTarget: draft.campaignParams?.exactTarget === true,
      task: flight.task
    }).flightGroupId
    spendHomeBaseLogistics()
    return flightGroupId
  }

  if (flight.task === 'SEAD' && flight.target) {
    const flightGroupId = SeadFlightGroup.spawn(draft, coalition, {
      homeBase: flight.homeBase.name,
      homeBasePosition: flight.homeBase.position,
      target: flight.target,
      targetPosition: flight.targetPosition,
      runwayAngle: flight.homeBase.runwayAngle,
      aircraftType: flight.aircraftType,
      tot: new Date(plan.tot.getTime() - config.packages.SEAD.leadTime),
      packageId: plan.id
    })
    spendHomeBaseLogistics()
    return flightGroupId
  }

  if (flight.task === 'DEAD' && flight.target) {
    const flightGroupId = DeadFlightGroup.spawn(draft, coalition, {
      homeBase: flight.homeBase.name,
      homeBasePosition: flight.homeBase.position,
      target: flight.target,
      targetPosition: flight.targetPosition,
      runwayAngle: flight.homeBase.runwayAngle,
      aircraftType: flight.aircraftType,
      packageId: plan.id
    }).flightGroupId
    spendHomeBaseLogistics()
    return flightGroupId
  }

  if (flight.task === 'CAS' && flight.target) {
    const flightGroupId = spawnPlannedFlightGroup({
      draft,
      coalition,
      task: 'CAS',
      aircraftType: flight.aircraftType,
      aircraftCount: config.packages.CAS.aircraftsPerGroup,
      homeBase: flight.homeBase.name,
      homeBasePosition: flight.homeBase.position,
      destination: flight.targetPosition,
      missionWaypoints: buildCasMissionWaypoints(flight.homeBase.position, flight.targetPosition),
      startTime: addMinutes(draft.time, 30),
      runwayAngle: flight.homeBase.runwayAngle,
      target: flight.target,
      packageId: plan.id
    }).flightGroupId
    spendHomeBaseLogistics()
    return flightGroupId
  }

  if (flight.task === 'Transport' && flight.transport) {
    const { flightGroupId } = TransportFlightGroup.spawn(draft, coalition, {
      homeBase: flight.homeBase.name,
      homeBasePosition: flight.homeBase.position,
      destinationPosition: flight.transport.destinationPosition,
      sourceNode: flight.transport.sourceNode,
      destinationNode: flight.transport.destinationNode,
      runwayAngle: flight.homeBase.runwayAngle,
      aircraftType: flight.aircraftType,
      cargoAmount: flight.transport.cargoAmount,
      transportType: flight.transport.transportType
    })

    const spawnedGroup = draft.coalitions[coalition].flightGroups.find(
      (group) => group.id === flightGroupId
    )
    if (spawnedGroup) {
      spawnedGroup.packageId = plan.id
    }

    spendHomeBaseLogistics()
    return flightGroupId
  }

  return null
}

export function commitAtoPackages(
  draft: Campaign,
  coalition: Coalition,
  plans: AtoPackagePlan[]
): void {
  for (const plan of plans) {
    const members: MissionPackage['members'] = []

    for (const flight of plan.flights) {
      const flightGroupId = commitFlight(draft, coalition, plan, flight)
      if (!flightGroupId) continue
      const totOffset =
        flight.task === 'SEAD'
          ? -config.packages.SEAD.leadTime
          : flight.tot
            ? flight.tot.getTime() - plan.tot.getTime()
            : 0
      members.push({
        flightGroupId,
        role: flight.role,
        totOffset
      })
    }

    if (members.length > 0) {
      createMissionPackage(draft, coalition, plan, members)
    }

    if (plan.kind === 'strategicStrike') {
      draft.coalitions[coalition].strategicStrikeCooldownUntil = undefined
    }
  }
}
