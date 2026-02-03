import { schemas, config } from '@dcc/contracts'
import * as z from 'zod'
import { FlightGroup } from './flight-group'
import { calculateDistance } from '../utils/calculate-distance'

export class CapFlightGroup extends FlightGroup {
  static spawn(
    draft: z.infer<typeof schemas.campaign.campaign>,
    coalition: z.infer<typeof schemas.coalition>,
    params: {
      homeBase: string
      homeBasePosition: z.infer<typeof schemas.position>
      patrolCenter: z.infer<typeof schemas.position>
      runwayAngle?: number
      aircraftType: z.infer<typeof schemas.dcs.aircraftName>
      packageId?: string
    }
  ): { flightGroupId: string; tot: Date } {
    // Create aircraft instances
    const numAircraft = config.packages.CAP.aircraftsPerGroup
    const aircrafts: z.infer<typeof schemas.aircraft>[] = []

    for (let i = 0; i < numAircraft; i++) {
      aircrafts.push({
        id: crypto.randomUUID(),
        unitName: `${params.aircraftType} ${i + 1}`,
        aircraftName: params.aircraftType
      })
    }

    // Calculate patrol racetrack pattern
    const dx = params.patrolCenter.x - params.homeBasePosition.x
    const dy = params.patrolCenter.y - params.homeBasePosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const ux = dx / distance
    const uy = dy / distance

    // Perpendicular direction for racetrack
    const px = -uy
    const py = ux

    // Racetrack legs - 40km apart, perpendicular to home-patrol direction
    const racetrackHalfLength = 20000
    const racetrackStart: z.infer<typeof schemas.waypoint> = {
      name: 'Racetrack Start',
      position: {
        x: params.patrolCenter.x + px * racetrackHalfLength,
        y: params.patrolCenter.y + py * racetrackHalfLength
      },
      altitude: 7000,
      speed: 200,
      type: 'Task'
    }

    const racetrackEnd: z.infer<typeof schemas.waypoint> = {
      name: 'Racetrack End',
      position: {
        x: params.patrolCenter.x - px * racetrackHalfLength,
        y: params.patrolCenter.y - py * racetrackHalfLength
      },
      altitude: 7000,
      speed: 200,
      type: 'RaceTrack End'
    }

    // Start 10-20 minutes in the future
    const startTime = new Date(
      draft.time.getTime() + Math.floor(Math.random() * (20 - 10 + 1) + 10) * 60 * 1000
    )

    const flightplan = FlightGroup.createFlightPlan(
      params.homeBasePosition,
      params.patrolCenter,
      [racetrackStart, racetrackEnd],
      startTime,
      params.runwayAngle
    )

    const flightGroupId = FlightGroup.create(draft, coalition, {
      aircrafts,
      task: 'CAP',
      position: params.homeBasePosition,
      homeBase: params.homeBase,
      flightplan,
      packageId: params.packageId
    })

    const tot = FlightGroup.calculateTot(flightplan)

    console.log(
      `Spawned CAP group from ${params.homeBase} patrolling near ${params.patrolCenter.x}, ${params.patrolCenter.y}`
    )

    return { flightGroupId, tot: tot ?? startTime }
  }

  /**
   * CAP engagement logic - engages enemy aircraft within detection/weapon range
   * Returns true if CAP engaged targets this tick
   */
  engageAirTargets(
    draft: z.infer<typeof schemas.campaign.campaign>,
    coalition: z.infer<typeof schemas.coalition>
  ): boolean {
    const enemyCoalition = coalition === 'player' ? 'opponent' : 'player'
    const enemyFlightGroups = draft.coalitions[enemyCoalition].flightGroups

    // CAP engagement range (radar detection + missile range approximation)
    const engagementRange = config.packages.CAP.engagementRange

    let engaged = false

    for (const enemyFg of enemyFlightGroups) {
      const distance = calculateDistance(this._data.position, enemyFg.position)

      if (distance <= engagementRange) {
        // Engage enemy aircraft
        engaged = true

        // Each CAP aircraft has a chance to shoot down an enemy
        for (const capAircraft of this._data.aircrafts) {
          // Base hit probability decreases with distance
          const distanceFactor = 1 - distance / engagementRange
          const hitChance = 0.15 * distanceFactor // 15% max hit chance per tick

          if (Math.random() < hitChance && enemyFg.aircrafts.length > 0) {
            const shotDownAircraft = enemyFg.aircrafts.pop()
            console.log(
              `CAP aircraft ${capAircraft.unitName} shot down enemy ${shotDownAircraft?.unitName}`
            )
          }
        }

        // Enemy can shoot back at CAP
        for (const enemyAircraft of enemyFg.aircrafts) {
          const enemyHitChance = 0.1 * (1 - distance / engagementRange)
          if (Math.random() < enemyHitChance && this._data.aircrafts.length > 0) {
            const lostAircraft = this._data.aircrafts.pop()
            console.log(
              `CAP aircraft ${lostAircraft?.unitName} shot down by enemy ${enemyAircraft.unitName}`
            )
          }
        }
      }
    }

    return engaged
  }
}

export const isCapFlightGroup = (flightGroup: FlightGroup): flightGroup is CapFlightGroup => {
  return flightGroup.task === 'CAP'
}
