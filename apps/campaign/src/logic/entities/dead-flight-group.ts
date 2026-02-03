import { schemas, config } from '@dcc/contracts'
import { samTemplates } from '@dcc/data'
import * as z from 'zod'
import { FlightGroup } from './flight-group'
import { calculateDistance } from '../utils/calculate-distance'
import { getObjectivePosition } from '../utils/get-objective-position'

export class DeadFlightGroup extends FlightGroup {
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
      packageId?: string
    }
  ): { flightGroupId: string; tot: Date } {
    // Create aircraft instances
    const numAircraft = config.packages.DEAD.aircraftsPerGroup
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

    // Start 30-50 minutes in the future
    const startTime = new Date(
      draft.time.getTime() + Math.floor(Math.random() * (50 - 30 + 1) + 30) * 60 * 1000
    )

    const flightplan = FlightGroup.createFlightPlan(
      params.homeBasePosition,
      params.targetPosition,
      [ingressWaypoint, targetWaypoint, egressWaypoint],
      startTime,
      params.runwayAngle
    )

    const flightGroupId = FlightGroup.create(draft, coalition, {
      aircrafts,
      task: 'DEAD',
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

    const tot = FlightGroup.calculateTot(flightplan)

    console.log(
      `Spawned DEAD group from ${params.homeBase} targeting ${params.target.type} at ${params.target.objectiveId}`
    )

    return { flightGroupId, tot: tot ?? startTime }
  }

  /**
   * DEAD attack logic - destroys enemy SAM when aircraft reaches target
   * Unlike SEAD which suppresses temporarily, DEAD destroys permanently
   */
  destroySam(
    draft: z.infer<typeof schemas.campaign.campaign>,
    coalition: z.infer<typeof schemas.coalition>,
    theatre: z.infer<typeof schemas.theatre>
  ) {
    if (!this._data.target || !this._data.tot || this._data.targetDestroyed) {
      return
    }

    // Only attack after ToT
    if (draft.time < this._data.tot) {
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

    // DEAD attacks when within engagement range (1.2x SAM range for standoff weapons)
    const attackRange = samTemplate.range * 1.2
    const isInRange = distanceToSam <= attackRange

    if (isInRange) {
      // 50% chance per aircraft to destroy the SAM
      // Each aircraft makes one attack attempt
      for (const aircraft of this._data.aircrafts) {
        if (Math.random() <= 0.5) {
          // Successful attack - mark SAM as destroyed
          samGroup.destroyed = true
          console.log(`DEAD aircraft ${aircraft.unitName} destroyed ${samGroup.type}`)
          this._data.targetDestroyed = true
          return
        } else {
          console.log(`DEAD aircraft ${aircraft.unitName} missed ${samGroup.type}`)
        }
      }

      // If all attacks missed, SAM can shoot back
      // Higher chance than SEAD since DEAD aircraft need to get closer
      const shootDownChance = 0.1
      if (Math.random() < shootDownChance) {
        if (this._data.aircrafts.length > 0) {
          const removedAircraft = this._data.aircrafts.pop()
          console.log(`DEAD aircraft ${removedAircraft?.unitName} shot down by ${samGroup.type}`)
        }
      }
    }
  }
}

export const isDeadFlightGroup = (flightGroup: FlightGroup): flightGroup is DeadFlightGroup => {
  return flightGroup.task === 'DEAD'
}
