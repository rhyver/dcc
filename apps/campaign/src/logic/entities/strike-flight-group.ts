import { schemas, config } from '@dcc/contracts'
import * as z from 'zod'
import { FlightGroup } from './flight-group'
import { buildAttackMissionWaypoints, spawnPlannedFlightGroup } from './flight-group-spawn'
import { logCombatAction } from '../simulation-log'

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
    const numAircraft = config.packages['Pinpoint Strike'].aircraftsPerGroup
    const missionWaypoints = buildAttackMissionWaypoints(
      params.homeBasePosition,
      params.targetPosition
    )

    const startTime = new Date(
      draft.time.getTime() + Math.floor(Math.random() * (50 - 30 + 1) + 30) * 60 * 1000
    )

    const { flightGroupId, tot } = spawnPlannedFlightGroup({
      draft,
      coalition,
      task: 'Pinpoint Strike',
      aircraftType: params.aircraftType,
      aircraftCount: numAircraft,
      homeBase: params.homeBase,
      homeBasePosition: params.homeBasePosition,
      destination: params.targetPosition,
      missionWaypoints,
      startTime,
      runwayAngle: params.runwayAngle,
      target: {
        id: params.target.id,
        type: params.target.type,
        objectiveId: params.target.objectiveId
      },
      packageId: params.packageId
    })

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
      let destroyedCount = 0
      structure.buildings.forEach((b) => {
        if (Math.random() <= 0.7) {
          b.alive = false
          destroyedCount++
        }
      })
      logCombatAction(
        draft,
        coalition,
        `Strike hit ${structure.name} at ${structure.objectiveId}: destroyed ${destroyedCount}/${structure.buildings.length} buildings`
      )
    }

    this._data.targetDestroyed = true
  }
}

export const isStrikeFlightGroup = (flightGroup: FlightGroup): flightGroup is StrikeFlightGroup => {
  return flightGroup.task === 'Pinpoint Strike'
}
