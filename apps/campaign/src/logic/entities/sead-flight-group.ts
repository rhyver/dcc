import { schemas, config } from '@dcc/contracts'
import { samTemplates } from '@dcc/data'
import * as z from 'zod'
import { FlightGroup } from './flight-group'
import { calculateDistance } from '../utils/calculate-distance'
import { getObjectivePosition } from '../utils/get-objective-position'

export class SeadFlightGroup extends FlightGroup {
  static spawn(
    draft: z.infer<typeof schemas.campaign.campaign>,
    coalition: z.infer<typeof schemas.coalition>,
    params: {
      homeBase: string
      homeBasePosition: z.infer<typeof schemas.position>
      target: {
        id: string
        type: string
        objectiveId: string
      }
      targetPosition: z.infer<typeof schemas.position>
      runwayAngle?: number
      aircraftType: z.infer<typeof schemas.dcs.aircraftName>
      tot: Date // Required - SEAD ToT is determined by strike package
      packageId?: string
    }
  ): string {
    // Create aircraft instances
    const numAircraft = config.packages.SEAD.aircraftsPerGroup
    const aircrafts: z.infer<typeof schemas.aircraft>[] = []

    for (let i = 0; i < numAircraft; i++) {
      aircrafts.push({
        id: crypto.randomUUID(),
        unitName: `${params.aircraftType} ${i + 1}`,
        aircraftName: params.aircraftType
      })
    }

    const dx = params.targetPosition.x - params.homeBasePosition.x
    const dy = params.targetPosition.y - params.homeBasePosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const ux = dx / distance
    const uy = dy / distance
    const ipDistance = Math.max(20000, distance - 20000)

    const ingressWaypoint: z.infer<typeof schemas.waypoint> = {
      name: 'IP',
      position: {
        x: params.homeBasePosition.x + ux * ipDistance,
        y: params.homeBasePosition.y + uy * ipDistance
      },
      altitude: 6000,
      speed: 250,
      type: 'Nav'
    }

    const targetWaypoint: z.infer<typeof schemas.waypoint> = {
      name: 'Target',
      position: params.targetPosition,
      speed: 275,
      type: 'Task',
      altitude: 0
    }

    const egressWaypoint: z.infer<typeof schemas.waypoint> = {
      name: 'Egress',
      position: {
        x: params.homeBasePosition.x + ux * ipDistance,
        y: params.homeBasePosition.y + uy * ipDistance
      },
      altitude: 6000,
      speed: 250,
      type: 'Nav'
    }

    const missionWaypoints = [ingressWaypoint, targetWaypoint, egressWaypoint]

    // Calculate start time from desired ToT
    const startTime = FlightGroup.calculateStartTimeForTot(
      params.homeBasePosition,
      missionWaypoints,
      params.tot
    )

    const flightplan = FlightGroup.createFlightPlan(
      params.homeBasePosition,
      params.targetPosition,
      missionWaypoints,
      startTime,
      params.runwayAngle
    )

    const flightGroupId = FlightGroup.create(draft, coalition, {
      aircrafts,
      task: 'SEAD',
      position: params.homeBasePosition,
      homeBase: params.homeBase,
      target: {
        id: params.target.id,
        type: params.target.type,
        objectiveId: params.target.objectiveId
      },
      flightplan,
      packageId: params.packageId
    })

    console.log(
      `Spawned SEAD group from ${params.homeBase} targeting ${params.target.type} at ${params.target.objectiveId}`
    )

    return flightGroupId
  }

  suppressSam(
    draft: z.infer<typeof schemas.campaign.campaign>,
    coalition: z.infer<typeof schemas.coalition>,
    theatre: z.infer<typeof schemas.theatre>
  ) {
    if (!this._data.target) {
      return
    }

    const enemyCoalition = coalition === 'player' ? 'opponent' : 'player'
    const samGroup = draft.coalitions[enemyCoalition].samGroups.find(
      (s) => s.id === this._data.target?.id
    )

    if (!samGroup) {
      return
    }

    const samPosition = getObjectivePosition(theatre, samGroup.objectiveId)
    if (!samPosition) {
      return
    }

    const samTemplate = samTemplates[samGroup.type]
    if (!samTemplate) {
      return
    }

    const distanceToSam = calculateDistance(this._data.position, samPosition)

    // SEAD is suppressing when within SAM range
    const isInRange = distanceToSam <= samTemplate.range

    if (isInRange) {
      // Mark SAM as suppressed
      samGroup.suppressed = true

      // SAM has small chance to shoot down SEAD while in range (5-10% per tick)
      const shootDownChance = 0.05
      if (Math.random() < shootDownChance) {
        // Remove one aircraft from the flight
        if (this._data.aircrafts.length > 0) {
          const removedAircraft = this._data.aircrafts.pop()
          console.log(`SEAD aircraft ${removedAircraft?.unitName} shot down by ${samGroup.type}`)
        }
      }
    } else {
      // Check if this SEAD flight was previously suppressing this SAM
      // If we're no longer in range, clear suppression
      // (Note: In a more complex system, we'd track which SEAD is suppressing which SAM)
      samGroup.suppressed = false
    }
  }
}

export const isSeadFlightGroup = (flightGroup: FlightGroup): flightGroup is SeadFlightGroup => {
  return flightGroup.task === 'SEAD'
}
