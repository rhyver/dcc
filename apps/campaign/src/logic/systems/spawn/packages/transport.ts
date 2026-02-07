import { schemas, config } from '@dcc/contracts'
import * as z from 'zod'
import { TransportFlightGroup } from '../../../entities/transport-flight-group'
import { FlightGroupFactory } from '../../../entities/flight-group-factory'
import { getCoalitionAirdromes, pickRandomAircraftType, resolveSpawnContext, type AirdromeSelection } from './common'
import { getNodeSupply } from '../../update-supply'
import { calculateDistance } from '@/logic/utils/calculate-distance'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type Position = z.infer<typeof schemas.position>
type Supply = z.infer<typeof schemas.supply>

type SupplyNode = {
  id: string
  type: 'airdrome' | 'objective'
  position: Position
  supply: Supply
  runwayAngle?: number
}

export function spawnTransport(
  draft: Campaign,
  coalition: Coalition
): void {
  // Check max active limit
  const flightGroups = FlightGroupFactory.getCoalitionFlightGroups(draft, coalition)
  const transportGroups = flightGroups.filter((group) => group.task === 'Transport')

  if (transportGroups.length >= config.packages.Transport.maxActive[coalition]) {
    return
  }

  const context = resolveSpawnContext(draft, coalition)
  if (!context) return

  // Get available transport aircraft
  const transportAircraft = draft.coalitions[coalition].aircraftTypes['Transport']
  if (!transportAircraft || transportAircraft.length === 0) return

  // Find nodes needing resupply (sorted by urgency)
  const urgentNodes = findNodesNeedingResupply(draft, coalition, context.theatre)
  if (urgentNodes.length === 0) return

  const targetNode = urgentNodes[0]
  if (!targetNode) return

  // Find nearest supply source
  const source = findNearestSupplySource(draft, coalition, context.theatre, targetNode.position)
  if (!source) return

  // Determine transport type and cargo capacity
  const isStrategic = source.type === 'airdrome' && targetNode.type === 'airdrome'
  const isTactical = targetNode.type === 'objective'
  const isEmergency = targetNode.supply.status === 'critical'

  let aircraftType: string
  let cargoCapacity: number
  let transportType: 'strategic' | 'tactical' | 'emergency'

  if (isEmergency) {
    aircraftType = 'CH-47D'  // Fast emergency resupply
    cargoCapacity = config.packages.Transport.emergencyCargoCapacity
    transportType = 'emergency'
  } else if (isStrategic) {
    aircraftType = 'C-130'
    cargoCapacity = config.packages.Transport.c130CargoCapacity
    transportType = 'strategic'
  } else {
    aircraftType = 'CH-47D'
    cargoCapacity = config.packages.Transport.ch47CargoCapacity
    transportType = 'tactical'
  }

  // Ensure aircraft type exists
  if (!transportAircraft.includes(aircraftType)) {
    const selected = pickRandomAircraftType(transportAircraft)
    if (!selected) return
    aircraftType = selected
  }

  // Calculate cargo amount
  const cargoAmount = Math.min(
    cargoCapacity,
    Math.max(0, targetNode.supply.max - targetNode.supply.current)
  )

  if (cargoAmount <= 0) return

  // Spawn transport flight group
  TransportFlightGroup.spawn(draft, coalition, {
    homeBase: source.id,
    homeBasePosition: source.position,
    destinationPosition: targetNode.position,
    sourceNode: source.id,
    destinationNode: targetNode.id,
    runwayAngle: source.runwayAngle,
    aircraftType: aircraftType as any,
    cargoAmount,
    transportType
  })
}

function findNodesNeedingResupply(
  draft: Campaign,
  coalition: Coalition,
  theatre: z.infer<typeof schemas.theatre>
): SupplyNode[] {
  const nodes: SupplyNode[] = []
  const supplyNodes = draft.coalitions[coalition].supplyNodes

  if (!supplyNodes) return []

  // Check objectives
  for (const objId of draft.coalitions[coalition].objectiveIds) {
    const supply = supplyNodes[objId]
    const obj = theatre.objectives.find(o => o.name === objId)

    if (supply && obj && supply.status !== 'abundant') {
      nodes.push({
        id: objId,
        type: 'objective',
        position: obj.position,
        supply,
        urgency: 1 - (supply.current / supply.max)
      } as any)
    }
  }

  // Check airdromes
  for (const adName of draft.coalitions[coalition].airdromeNames) {
    const supply = supplyNodes[adName]
    const ad = theatre.airdromeDetails[adName]

    if (supply && ad && supply.status !== 'abundant') {
      nodes.push({
        id: adName,
        type: 'airdrome',
        position: { x: ad.x, y: ad.y },
        supply,
        runwayAngle: ad.runwayAngle,
        urgency: 1 - (supply.current / supply.max)
      } as any)
    }
  }

  return nodes.sort((a: any, b: any) => b.urgency - a.urgency)
}

function findNearestSupplySource(
  draft: Campaign,
  coalition: Coalition,
  theatre: z.infer<typeof schemas.theatre>,
  targetPos: Position
): SupplyNode | null {
  let nearest: SupplyNode | null = null
  let minDist = Infinity
  const supplyNodes = draft.coalitions[coalition].supplyNodes

  if (!supplyNodes) return null

  // Check airdromes with surplus
  for (const adName of draft.coalitions[coalition].airdromeNames) {
    const supply = supplyNodes[adName]
    const ad = theatre.airdromeDetails[adName]

    if (supply && ad && supply.current > supply.max * 0.5) {
      const dist = calculateDistance({ x: ad.x, y: ad.y }, targetPos)
      if (dist < minDist && dist < config.packages.Transport.maxDistance) {
        minDist = dist
        nearest = {
          id: adName,
          type: 'airdrome',
          position: { x: ad.x, y: ad.y },
          supply,
          runwayAngle: ad.runwayAngle
        }
      }
    }
  }

  return nearest
}
