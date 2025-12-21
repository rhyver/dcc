import { schemas, config } from '@dcc/contracts'
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

    // Create the flight group data
    const newFlightGroupData: z.infer<typeof schemas.flightGroup> = {
      id: crypto.randomUUID(),
      aircrafts,
      task: 'Pinpoint Strike',
      position: params.homeBasePosition,
      homeBase: params.homeBase,
      target: {
        id: params.target.id,
        type: params.target.type,
        objectiveId: params.target.objectiveId
      }
    }

    // Add the new flight group to the draft
    draft.coalitions[coalition].flightGroups.push(newFlightGroupData)

    console.log(
      `Spawned strike group from ${params.homeBase} targeting ${params.target.type} at ${params.target.objectiveId}`
    )
  }

  get target() {
    return this._data.target
  }

  setTarget(target: NonNullable<FlightGroupData['target']>) {
    this._data.target = target
  }
}
