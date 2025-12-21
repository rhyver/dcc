import { schemas, config } from '@dcc/contracts'
import { callsigns } from '@dcc/data'
import * as z from 'zod'
import { FlightGroup, type FlightGroupData } from './flight-group'

export class StrikeFlightGroup extends FlightGroup {
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
    }
  ): void {
    // Create aircraft instances
    const numAircraft = config.packages['Pinpoint Strike'].aircraftsPerGroup
    const aircrafts: z.infer<typeof schemas.aircraft>[] = []

    for (let i = 0; i < numAircraft; i++) {
      aircrafts.push({
        id: crypto.randomUUID(),
        unitName: `${params.aircraftType} ${i + 1}`,
        aircraftName: params.aircraftType
      })
    }

    const flightplan = this.createFlightPlan(
      params.homeBasePosition,
      params.targetPosition,
      draft.time,
      params.runwayAngle
    )

    // Create the flight group data
    const newFlightGroupData: z.infer<typeof schemas.flightGroup> = {
      id: crypto.randomUUID(),
      aircrafts,
      task: 'Pinpoint Strike',
      position: params.homeBasePosition,
      homeBase: params.homeBase,
      callsign: `${callsigns[Math.floor(Math.random() * callsigns.length)] ?? 'Enfield'}-${Math.floor(Math.random() * 9) + 1}`,
      target: {
        id: params.target.id,
        type: params.target.type,
        objectiveId: params.target.objectiveId
      },
      flightplan
    }

    // Add the new flight group to the draft
    draft.coalitions[coalition].flightGroups.push(newFlightGroupData)

    console.log(
      `Spawned strike group from ${params.homeBase} targeting ${params.target.type} at ${params.target.objectiveId}`
    )
  }

  static createFlightPlan(
    home: z.infer<typeof schemas.position>,
    target: z.infer<typeof schemas.position>,
    startTime: Date,
    runwayAngle?: number
  ): z.infer<typeof schemas.flightplan> {
    const waypoints: z.infer<typeof schemas.waypoint>[] = []
    const dx = target.x - home.x
    const dy = target.y - home.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    const ux = dx / distance
    const uy = dy / distance

    // If runway angle is provided, adjust ux/uy for Ascend/Descent to align with runway
    let ascendUx = ux
    let ascendUy = uy
    let descentUx = ux
    let descentUy = uy

    if (runwayAngle !== undefined) {
      // DCS coordinates: x=North, z=East (but here x, y).
      // If we assume x=North, y=East:
      // runwayAngle is degrees from North (CW).
      // Angle 0 -> (1, 0)
      // Angle 90 -> (0, 1)
      const rad = (runwayAngle * Math.PI) / 180
      const rx = Math.cos(rad)
      const ry = Math.sin(rad)

      // Determine if we should use angle or angle+180
      // Dot product with target vector
      const dot = rx * ux + ry * uy

      // If dot > 0, runway is roughly pointing towards target.
      // Ascend: fly along runway heading (rx, ry)
      // Descent: fly into runway heading?
      // Usually landing is INTO wind/runway heading.
      // So if runway heading is H, you land flying H.
      // You approach from -H.
      // So Descent point should be at home - (rx, ry) * dist?

      // Wait, if runway is 09 (East), you land flying East.
      // You approach from West. Descent point is West of airfield.
      // West is -East. So `home - vector`.

      // But which runway end to use? 09 or 27?
      // Pick the one aligned with takeoff towards target.
      // If dot > 0: Runway points to target.
      // Takeoff: Along (rx, ry).
      // Landing: Along (rx, ry). Approach from -(rx, ry).

      if (dot > 0) {
        ascendUx = rx
        ascendUy = ry
        descentUx = rx // Descent point is BEHIND runway start, so home - descentVector * dist
        descentUy = ry
      } else {
        // Runway points away. Use reciprocal (angle + 180).
        ascendUx = -rx
        ascendUy = -ry
        descentUx = -rx
        descentUy = -ry
      }
    }

    // 1. TakeOff
    waypoints.push({
      name: 'TakeOff',
      position: home,
      altitude: 0,
      speed: 150,
      type: 'TakeOff'
    })

    // 2. Ascend / Join (20km out)
    waypoints.push({
      name: 'Ascend',
      position: {
        x: home.x + ascendUx * 20000,
        y: home.y + ascendUy * 20000
      },
      altitude: 2000,
      speed: 200,
      type: 'Nav'
    })

    // 3. Ingress (IP - 20km from target)
    // If distance is short, handle gracefully? Assuming checked in spawn logic.
    const ipDistance = Math.max(20000, distance - 20000)
    waypoints.push({
      name: 'IP',
      position: {
        x: home.x + ux * ipDistance,
        y: home.y + uy * ipDistance
      },
      altitude: 6000,
      speed: 250,
      type: 'Nav'
    })

    // 4. Target
    waypoints.push({
      name: 'Target',
      position: target,
      altitude: 4000, // Attack altitude
      speed: 275,
      type: 'Task'
    })

    // 5. Egress (Turn away or just fly back to a point)
    // Let's create an egress point that is the same as IP but maybe different altitude
    waypoints.push({
      name: 'Egress',
      position: {
        x: home.x + ux * ipDistance,
        y: home.y + uy * ipDistance
      },
      altitude: 6000,
      speed: 250,
      type: 'Nav'
    })

    // 6. Descent (20km from home)
    // Descent point is "Final Approach Fix" roughly.
    // If landing direction is D, we should be at home - D * 20km.
    // So we use SUBTRACTION here relative to landing direction?
    // descentUx/Uy is the runway direction we selected (aligned with takeoff).
    // Assuming same direction for landing.
    waypoints.push({
      name: 'Descent',
      position: {
        x: home.x - descentUx * 20000,
        y: home.y - descentUy * 20000
      },
      altitude: 2000,
      speed: 200,
      type: 'Nav'
    })

    // 7. Landing
    waypoints.push({
      name: 'Landing',
      position: home,
      altitude: 0,
      speed: 150,
      type: 'Landing'
    })

    return {
      id: crypto.randomUUID(),
      startTime,
      waypoints
    }
  }

  get target() {
    return this._data.target
  }

  setTarget(target: NonNullable<FlightGroupData['target']>) {
    this._data.target = target
  }
}
