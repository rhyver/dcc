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
      packageId?: string
    }
  ): { flightGroupId: string; tot: Date } {
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
      task: 'Pinpoint Strike',
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
      `Spawned strike group from ${params.homeBase} targeting ${params.target.type} at ${params.target.objectiveId}`
    )

    return { flightGroupId, tot: tot ?? startTime }
  }

  strikeStructure(
    draft: z.infer<typeof schemas.campaign.campaign>,
    coalition: z.infer<typeof schemas.coalition>
  ) {
    if (!this._data.target || !this._data.tot || this._data.targetDestroyed) {
      console.log(this._data.tot)
      return
    }

    if (draft.time < this._data.tot) {
      console.log(draft.time, this._data.tot)
      return
    }

    const enemyCoalition = coalition === 'player' ? 'opponent' : 'player'
    const structure = draft.coalitions[enemyCoalition].structures.find(
      (s) => s.id === this._data.target?.id
    )

    console.log('Striking structure', structure?.name)

    if (structure && structure.buildings.some((b) => b.alive)) {
      structure.buildings.forEach((b) => {
        if (Math.random() <= 0.7) {
          b.alive = false
        }
      })
    }

    this._data.targetDestroyed = true
  }
}

export const isStrikeFlightGroup = (flightGroup: FlightGroup): flightGroup is StrikeFlightGroup => {
  return flightGroup.task === 'Pinpoint Strike'
}
