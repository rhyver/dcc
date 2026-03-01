import { schemas } from '@dcc/contracts'
import { aircrafts } from '@dcc/data'
import * as z from 'zod'

import { FlightGroup } from './flight-group'
import { logSpawnAction } from '../simulation-log'

const aircraftMap = new Map(Object.values(aircrafts).map((def) => [def.name, def]))

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type Position = z.infer<typeof schemas.position>
type Waypoint = z.infer<typeof schemas.waypoint>
type FlightTask = z.infer<typeof schemas.flightGroup>['task']
type AircraftName = z.infer<typeof schemas.dcs.aircraftName>
type Aircraft = z.infer<typeof schemas.aircraft>
type FlightTarget = NonNullable<z.infer<typeof schemas.flightGroup>['target']>

export function buildAttackMissionWaypoints(
  homeBasePosition: Position,
  targetPosition: Position
): Waypoint[] {
  const dx = targetPosition.x - homeBasePosition.x
  const dy = targetPosition.y - homeBasePosition.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const ux = distance > 0 ? dx / distance : 1
  const uy = distance > 0 ? dy / distance : 0
  const ipDistance = Math.max(20000, distance - 20000)

  return [
    {
      name: 'IP',
      position: {
        x: homeBasePosition.x + ux * ipDistance,
        y: homeBasePosition.y + uy * ipDistance
      },
      altitude: 6000,
      speed: 250,
      type: 'Nav'
    },
    {
      name: 'Target',
      position: targetPosition,
      speed: 275,
      type: 'Task',
      altitude: 0
    },
    {
      name: 'Egress',
      position: {
        x: homeBasePosition.x + ux * ipDistance,
        y: homeBasePosition.y + uy * ipDistance
      },
      altitude: 6000,
      speed: 250,
      type: 'Nav'
    }
  ]
}

export function buildCapMissionWaypoints(
  homeBasePosition: Position,
  patrolCenter: Position
): Waypoint[] {
  const dx = patrolCenter.x - homeBasePosition.x
  const dy = patrolCenter.y - homeBasePosition.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const ux = distance > 0 ? dx / distance : 1
  const uy = distance > 0 ? dy / distance : 0

  const px = -uy
  const py = ux
  const racetrackHalfLength = 20000

  return [
    {
      name: 'Racetrack Start',
      position: {
        x: patrolCenter.x + px * racetrackHalfLength,
        y: patrolCenter.y + py * racetrackHalfLength
      },
      altitude: 7000,
      speed: 200,
      type: 'Task'
    },
    {
      name: 'Racetrack End',
      position: {
        x: patrolCenter.x - px * racetrackHalfLength,
        y: patrolCenter.y - py * racetrackHalfLength
      },
      altitude: 7000,
      speed: 200,
      type: 'RaceTrack End'
    }
  ]
}

export function buildTransportMissionWaypoints(
  homeBasePosition: Position,
  destinationPosition: Position
): Waypoint[] {
  // Helicopters fly direct at low altitude - no climb/descent phases needed
  return [
    {
      name: 'Direct',
      position: destinationPosition,
      altitude: 300, // Low cruise altitude
      speed: 100, // Helicopter cruise speed
      type: 'Nav'
    }
  ]
}

export function createAircrafts(aircraftType: AircraftName, count: number): Aircraft[] {
  const aircrafts: Aircraft[] = []
  for (let i = 0; i < count; i++) {
    aircrafts.push({
      id: crypto.randomUUID(),
      unitName: `${aircraftType} ${i + 1}`,
      aircraftName: aircraftType
    })
  }
  return aircrafts
}

export function spawnPlannedFlightGroup({
  draft,
  coalition,
  task,
  aircraftType,
  aircraftCount,
  homeBase,
  homeBasePosition,
  destination,
  missionWaypoints,
  startTime,
  runwayAngle,
  target,
  packageId,
  tot
}: {
  draft: Campaign
  coalition: Coalition
  task: FlightTask
  aircraftType: AircraftName
  aircraftCount: number
  homeBase: string
  homeBasePosition: Position
  destination: Position
  missionWaypoints: Waypoint[]
  startTime: Date
  runwayAngle?: number
  target?: FlightTarget
  packageId?: string
  tot?: Date
}): { flightGroupId: string; tot: Date; flightplan: z.infer<typeof schemas.flightplan> } {
  const isHelicopter = aircraftMap.get(aircraftType)?.isHelicopter ?? false
  const acList = createAircrafts(aircraftType, aircraftCount)

  const flightplan = FlightGroup.createFlightPlan(
    homeBasePosition,
    destination,
    missionWaypoints,
    startTime,
    runwayAngle,
    isHelicopter
  )

  const flightGroupId = FlightGroup.create(draft, coalition, {
    aircrafts: acList,
    task,
    position: homeBasePosition,
    homeBase,
    target,
    flightplan,
    packageId,
    tot
  })

  const calculatedTot = FlightGroup.calculateTot(flightplan)
  const effectiveTot = tot ?? calculatedTot ?? startTime
  const targetLabel = target?.objectiveId ? ` -> ${target.objectiveId}` : ''
  const spawnedFlightGroup = draft.coalitions[coalition].flightGroups.find(
    (group) => group.id === flightGroupId
  )
  const callsign = spawnedFlightGroup?.callsign
  logSpawnAction(
    draft,
    coalition,
    `${task} from ${homeBase} (${aircraftCount}x ${aircraftType})${targetLabel}`,
    callsign,
    {
      entityType: 'flightGroup',
      entityId: flightGroupId
    }
  )

  return {
    flightGroupId,
    tot: effectiveTot,
    flightplan
  }
}
