import { schemas } from '@dcc/contracts'
import { callsigns } from '@dcc/data'
import * as z from 'zod'

export type FlightGroupData = z.infer<typeof schemas.flightGroup>

export class FlightGroup {
  static create(
    draft: z.infer<typeof schemas.campaign.campaign>,
    coalition: z.infer<typeof schemas.coalition>,
    params: {
      aircrafts: z.infer<typeof schemas.aircraft>[]
      task: z.infer<typeof schemas.flightGroup>['task']
      position: z.infer<typeof schemas.position>
      homeBase: string
      callsign?: string
      target?: z.infer<typeof schemas.flightGroup>['target']
      flightplan: z.infer<typeof schemas.flightplan>
    }
  ): void {
    const newFlightGroupData: z.infer<typeof schemas.flightGroup> = {
      id: crypto.randomUUID(),
      aircrafts: params.aircrafts,
      task: params.task,
      position: params.position,
      homeBase: params.homeBase,
      callsign:
        params.callsign ??
        `${callsigns[Math.floor(Math.random() * callsigns.length)] ?? 'Enfield'}-${
          Math.floor(Math.random() * 9) + 1
        }`,
      target: params.target,
      flightplan: params.flightplan
    }

    draft.coalitions[coalition].flightGroups.push(newFlightGroupData)
  }

  static createFlightPlan(
    home: z.infer<typeof schemas.position>,
    destination: z.infer<typeof schemas.position>,
    missionWaypoints: z.infer<typeof schemas.waypoint>[],
    startTime: Date,
    runwayAngle?: number
  ): z.infer<typeof schemas.flightplan> {
    const waypoints: z.infer<typeof schemas.waypoint>[] = []
    const dx = destination.x - home.x
    const dy = destination.y - home.y
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

    // 3. Mission Waypoints
    waypoints.push(...missionWaypoints)

    // 4. Descent (20km from home)
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

  static getCoalitionFlightGroups(
    draft: z.infer<typeof schemas.campaign.campaign>,
    coalition: z.infer<typeof schemas.coalition>
  ): FlightGroup[] {
    return draft.coalitions[coalition].flightGroups.map((data) => new FlightGroup(data))
  }

  constructor(protected _data: FlightGroupData) {}

  // Getters read from the wrapped data object
  get id() {
    return this._data.id
  }

  get task() {
    return this._data.task
  }

  get position() {
    return this._data.position
  }

  get homeBase() {
    return this._data.homeBase
  }

  get aircrafts() {
    return this._data.aircrafts
  }

  get target() {
    return this._data.target
  }

  // Setters mutate the wrapped data object (works with Immer drafts)
  setPosition(newPosition: z.infer<typeof schemas.position>) {
    this._data.position = newPosition
  }

  setHomeBase(newHomeBase: string) {
    this._data.homeBase = newHomeBase
  }

  setTarget(target: NonNullable<FlightGroupData['target']>) {
    this._data.target = target
  }

  // Logic methods can be added here
  updateLogic(_delta: number) {
    // Example: Update flight group logic based on delta time
    // This mutates the internal _data object which can be an Immer draft
  }
}
