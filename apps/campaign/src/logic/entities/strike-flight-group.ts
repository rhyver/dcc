import { schemas, config } from '@dcc/contracts'
import * as z from 'zod'
import { FlightGroup } from './flight-group'

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
      altitude: 4000,
      speed: 275,
      type: 'Task'
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

    FlightGroup.create(draft, coalition, {
      aircrafts,
      task: 'Pinpoint Strike',
      position: params.homeBasePosition,
      homeBase: params.homeBase,
      target: {
        id: params.target.id,
        type: params.target.type,
        objectiveId: params.target.objectiveId
      },
      flightplan
    })

    console.log(
      `Spawned strike group from ${params.homeBase} targeting ${params.target.type} at ${params.target.objectiveId}`
    )
  }
}
