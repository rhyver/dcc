import { schemas, config } from '@dcc/contracts'
import * as z from 'zod'
import { FlightGroup } from './flight-group'
import { buildTransportMissionWaypoints, spawnPlannedFlightGroup } from './flight-group-spawn'
import { getNodeSupply } from '../systems/update-supply'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type Position = z.infer<typeof schemas.position>
type AircraftName = z.infer<typeof schemas.dcs.aircraftName>

export class TransportFlightGroup extends FlightGroup {
  static spawn(
    draft: Campaign,
    coalition: Coalition,
    params: {
      homeBase: string
      homeBasePosition: Position
      destinationPosition: Position
      sourceNode: string
      destinationNode: string
      runwayAngle?: number
      aircraftType: AircraftName
      cargoAmount: number
      transportType: 'strategic' | 'tactical' | 'emergency'
    }
  ): { flightGroupId: string; tot: Date } {
    const missionWaypoints = buildTransportMissionWaypoints(
      params.homeBasePosition,
      params.destinationPosition
    )

    const startTime = new Date(
      draft.time.getTime() + Math.floor(Math.random() * (30 - 10 + 1) + 10) * 60 * 1000
    )

    const result = spawnPlannedFlightGroup({
      draft,
      coalition,
      task: 'Transport',
      aircraftType: params.aircraftType,
      aircraftCount: 1,  // Transport flies solo
      homeBase: params.homeBase,
      homeBasePosition: params.homeBasePosition,
      destination: params.destinationPosition,
      missionWaypoints,
      startTime,
      runwayAngle: params.runwayAngle
    })

    // Extend with transport-specific fields
    const flightGroup = draft.coalitions[coalition].flightGroups.find(
      fg => fg.id === result.flightGroupId
    )
    if (flightGroup) {
      flightGroup.cargoAmount = params.cargoAmount
      flightGroup.sourceNode = params.sourceNode
      flightGroup.destinationNode = params.destinationNode
      flightGroup.cargoStatus = 'loaded'
      flightGroup.transportType = params.transportType

      // Deduct cargo from source immediately
      const sourceSupply = getNodeSupply(draft, coalition, params.sourceNode)
      if (sourceSupply) {
        sourceSupply.current -= params.cargoAmount
      }
    }

    console.log(
      `Spawned ${params.transportType} transport from ${params.homeBase} to ${params.destinationNode} with ${params.cargoAmount} supplies`
    )

    return { flightGroupId: result.flightGroupId, tot: result.tot }
  }

  /**
   * Called when transport lands at destination
   */
  deliverCargo(draft: Campaign, coalition: Coalition): void {
    if (this._data.cargoStatus !== 'loaded' && this._data.cargoStatus !== 'in-transit') return
    if (!this._data.destinationNode || !this._data.cargoAmount) return

    const destinationSupply = getNodeSupply(draft, coalition, this._data.destinationNode)
    if (destinationSupply) {
      destinationSupply.current += this._data.cargoAmount
      this._data.cargoStatus = 'delivered'

      console.log(
        `Transport ${this._data.callsign} delivered ${this._data.cargoAmount} supplies to ${this._data.destinationNode}`
      )
    }
  }

  /**
   * Called when transport is destroyed
   */
  loseCargo(): void {
    if (this._data.cargoStatus === 'loaded' || this._data.cargoStatus === 'in-transit') {
      this._data.cargoStatus = 'lost'
      console.log(`Transport ${this._data.callsign} lost ${this._data.cargoAmount} supplies`)
    }
  }
}

export const isTransportFlightGroup = (flightGroup: FlightGroup): flightGroup is TransportFlightGroup => {
  return flightGroup.task === 'Transport'
}
