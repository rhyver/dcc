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
      draft.time
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
    startTime: Date
  ): z.infer<typeof schemas.flightplan> {
    const waypoints: z.infer<typeof schemas.waypoint>[] = []
    const dx = target.x - home.x
    const dy = target.y - home.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const ux = dx / distance
    const uy = dy / distance

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
        x: home.x + ux * 20000,
        y: home.y + uy * 20000
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
    waypoints.push({
      name: 'Descent',
      position: {
        x: home.x + ux * 20000,
        y: home.y + uy * 20000
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
