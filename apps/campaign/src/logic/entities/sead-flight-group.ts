import { schemas, config } from '@dcc/contracts'
import { samTemplates } from '@dcc/data'
import * as z from 'zod'
import { FlightGroup } from './flight-group'
import { calculateDistance } from '../utils/calculate-distance'
import { getObjectivePosition } from '../utils/get-objective-position'
import { buildAttackMissionWaypoints, spawnPlannedFlightGroup } from './flight-group-spawn'
import { logCombatAction } from '../simulation-log'
import { debugLog } from '@/lib/debug'

export class SeadFlightGroup extends FlightGroup {
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
      tot: Date // Required - SEAD ToT is determined by strike package
      packageId?: string
    }
  ): string {
    const numAircraft = config.packages.SEAD.aircraftsPerGroup
    const missionWaypoints = buildAttackMissionWaypoints(
      params.homeBasePosition,
      params.targetPosition
    )

    // Calculate start time from desired ToT
    const startTime = FlightGroup.calculateStartTimeForTot(
      params.homeBasePosition,
      missionWaypoints,
      params.tot
    )

    const { flightGroupId } = spawnPlannedFlightGroup({
      draft,
      coalition,
      task: 'SEAD',
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
      packageId: params.packageId,
      tot: params.tot
    })

    debugLog(
      `Spawned SEAD group from ${params.homeBase} targeting ${params.target.type} at ${params.target.objectiveId}`
    )

    return flightGroupId
  }

  suppressSam(
    draft: z.infer<typeof schemas.campaign.campaign>,
    coalition: z.infer<typeof schemas.coalition>,
    theatre: z.infer<typeof schemas.theatre>
  ) {
    if (!this._data.target) {
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

    // SEAD is suppressing when within SAM range
    const isInRange = distanceToSam <= samTemplate.range

    if (isInRange) {
      const wasSuppressed = samGroup.suppressed

      // Mark SAM as suppressed
      samGroup.suppressed = true
      if (!wasSuppressed) {
        logCombatAction(
          draft,
          coalition,
          `SEAD established suppression on ${samGroup.type} at ${samGroup.objectiveId}`,
          this._data.callsign,
          {
            entityType: 'flightGroup',
            entityId: this._data.id
          }
        )
      }

      // SAM has small chance to shoot down SEAD while in range (5-10% per tick)
      const shootDownChance = 0.05
      if (Math.random() < shootDownChance) {
        // Remove one aircraft from the flight
        if (this._data.aircrafts.length > 0) {
          const removedAircraft = this._data.aircrafts.pop()
          debugLog(`SEAD aircraft ${removedAircraft?.unitName} shot down by ${samGroup.type}`)
          if (removedAircraft) {
            logCombatAction(
              draft,
              coalition,
              `SEAD ${removedAircraft.unitName} shot down by ${samGroup.type}`,
              this._data.callsign,
              {
                entityType: 'flightGroup',
                entityId: this._data.id
              }
            )
          }
        }
      }
    } else {
      // Check if this SEAD flight was previously suppressing this SAM
      // If we're no longer in range, clear suppression
      // (Note: In a more complex system, we'd track which SEAD is suppressing which SAM)
      if (samGroup.suppressed) {
        logCombatAction(
          draft,
          coalition,
          `SEAD lost suppression on ${samGroup.type} at ${samGroup.objectiveId}`,
          this._data.callsign,
          {
            entityType: 'flightGroup',
            entityId: this._data.id
          }
        )
      }
      samGroup.suppressed = false
    }
  }
}

export const isSeadFlightGroup = (flightGroup: FlightGroup): flightGroup is SeadFlightGroup => {
  return flightGroup.task === 'SEAD'
}
