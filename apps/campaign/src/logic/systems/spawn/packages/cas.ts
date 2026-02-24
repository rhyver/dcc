import { config, schemas } from '@dcc/contracts'
import * as z from 'zod'
import { buildAttackMissionWaypoints, spawnPlannedFlightGroup } from '../../../entities/flight-group-spawn'
import { FlightGroupFactory } from '../../../entities/flight-group-factory'
import { getObjectivePosition } from '@/logic/utils/get-objective-position'
import {
  getCoalitionAirdromes,
  pickRandomAircraftType,
  resolveSpawnContext,
  selectHomeBaseAndTarget
} from './common'
import { getNodeSupply } from '../../update-supply'

function getAirbaseSpawnModifier(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>,
  airbaseName: string
): number {
  const supply = getNodeSupply(draft, coalition, airbaseName)
  if (!supply) return 1.0

  switch (supply.status) {
    case 'abundant':
    case 'adequate':
    case 'low':
      return 1.0
    case 'critical':
      return 0.5
    case 'depleted':
      return 0
  }
}

export function spawnCas(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  const flightGroups = FlightGroupFactory.getCoalitionFlightGroups(draft, coalition)
  const casGroups = flightGroups.filter((group) => group.task === 'CAS')

  if (casGroups.length >= config.packages.CAS.maxActive[coalition]) {
    return
  }

  const targetedGroundGroupIds = new Set(
    casGroups.map((g) => g.target?.id).filter((id): id is string => id != null)
  )

  const context = resolveSpawnContext(draft, coalition)
  if (!context) {
    return
  }

  const { theatre, enemyCoalition } = context
  const availableAircraftTypes = draft.coalitions[coalition].aircraftTypes.CAS
  if (!availableAircraftTypes || availableAircraftTypes.length === 0) {
    return
  }

  const candidateGroundGroups = draft.coalitions[enemyCoalition].groundGroups.filter(
    (group) =>
      group.state === 'idle' &&
      group.objectiveId != null &&
      !targetedGroundGroupIds.has(group.id)
  )

  if (candidateGroundGroups.length === 0) {
    return
  }

  const homeBases = getCoalitionAirdromes(draft, theatre, coalition)
  const availableTargets: Array<{
    target: {
      id: string
      type: string
      objectiveId: string
    }
    position: z.infer<typeof schemas.position>
  }> = []

  for (const group of candidateGroundGroups) {
    const objectiveId = group.objectiveId
    if (!objectiveId) continue

    const objectivePosition = getObjectivePosition(theatre, objectiveId)
    if (!objectivePosition) continue

    availableTargets.push({
      target: {
        id: group.id,
        type: 'Ground Group',
        objectiveId
      },
      position: objectivePosition
    })
  }

  const selectedAssignment = selectHomeBaseAndTarget({
    homeBases,
    targets: availableTargets,
    maxDistance: config.packages.CAS.maxDistance
  })

  if (!selectedAssignment) {
    return
  }

  const spawnModifier = getAirbaseSpawnModifier(draft, coalition, selectedAssignment.homeBase.name)
  if (Math.random() > spawnModifier) {
    return
  }

  const selectedAircraftType = pickRandomAircraftType(availableAircraftTypes)
  if (!selectedAircraftType) {
    return
  }

  const missionWaypoints = buildAttackMissionWaypoints(
    selectedAssignment.homeBase.position,
    selectedAssignment.targetPosition
  )
  const startTime = new Date(
    draft.time.getTime() + Math.floor(Math.random() * (50 - 30 + 1) + 30) * 60 * 1000
  )

  spawnPlannedFlightGroup({
    draft,
    coalition,
    task: 'CAS',
    aircraftType: selectedAircraftType,
    aircraftCount: config.packages.CAS.aircraftsPerGroup,
    homeBase: selectedAssignment.homeBase.name,
    homeBasePosition: selectedAssignment.homeBase.position,
    destination: selectedAssignment.targetPosition,
    missionWaypoints,
    startTime,
    runwayAngle: selectedAssignment.homeBase.runwayAngle,
    target: selectedAssignment.target
  })
}
