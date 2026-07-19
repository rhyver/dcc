import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { buildCsarMissionWaypoints, spawnPlannedFlightGroup } from './flight-group-spawn'
import { FlightGroup } from './flight-group'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type Position = z.infer<typeof schemas.position>
type AircraftName = z.infer<typeof schemas.dcs.aircraftName>
type DownedPilot = z.infer<typeof schemas.campaign.campaignDownedPilot>

export class CsarFlightGroup extends FlightGroup {
  static spawn(
    draft: Campaign,
    coalition: Coalition,
    params: {
      pilot: DownedPilot
      targetObjectiveId: string
      homeBase: string
      homeBasePosition: Position
      dropOffPosition: Position
      runwayAngle?: number
      aircraftType: AircraftName
      packageId: string
    }
  ): { flightGroupId: string; tot: Date } {
    const missionWaypoints = buildCsarMissionWaypoints(
      params.pilot.position,
      params.dropOffPosition
    )
    const startTime = new Date(draft.time.getTime() + 10 * 60 * 1000)

    return spawnPlannedFlightGroup({
      draft,
      coalition,
      task: 'CSAR',
      aircraftType: params.aircraftType,
      aircraftCount: 1,
      homeBase: params.homeBase,
      homeBasePosition: params.homeBasePosition,
      destination: params.pilot.position,
      missionWaypoints,
      startTime,
      runwayAngle: params.runwayAngle,
      target: {
        id: params.pilot.id,
        type: 'Downed Pilot',
        objectiveId: params.targetObjectiveId
      },
      packageId: params.packageId
    })
  }
}

export const isCsarFlightGroup = (flightGroup: FlightGroup): flightGroup is CsarFlightGroup =>
  flightGroup.task === 'CSAR'
