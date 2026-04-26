import { schemas, config } from '@dcc/contracts'
import * as z from 'zod'
import { DeadFlightGroup } from '../../../entities/dead-flight-group'
import { FlightGroupFactory } from '../../../entities/flight-group-factory'
import { getObjectivePosition } from '@/logic/utils/get-objective-position'
import {
  getCoalitionAirdromes,
  pickRandomAircraftType,
  resolveSpawnContext,
  selectHomeBaseAndTarget
} from './common'
import { getNodeSupply } from '../../update-supply'
import { debugLog } from '@/lib/debug'

/**
 * Get sortie rate multiplier based on airbase supply status
 */
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
      return 0.5 // Half sortie rate
    case 'depleted':
      return 0 // No sorties
  }
}

export function spawnDead(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  const flightGroups = FlightGroupFactory.getCoalitionFlightGroups(draft, coalition)

  const deadGroups = flightGroups.filter((group) => group.task === 'DEAD')

  debugLog(`${coalition}: DEAD groups`, deadGroups.length)

  if (deadGroups.length >= config.packages.DEAD.maxActive[coalition]) {
    return
  }

  // Get targeted SAM IDs to avoid double-targeting
  const targetedSamIds = new Set(
    deadGroups.map((g) => g.target?.id).filter((id): id is string => !!id)
  )

  const context = resolveSpawnContext(draft, coalition)
  if (!context) {
    return
  }
  const { theatre, enemyCoalition } = context

  // Get available aircraft types for DEAD missions
  const availableAircraftTypes = draft.coalitions[coalition].aircraftTypes['DEAD']
  if (!availableAircraftTypes || availableAircraftTypes.length === 0) {
    debugLog('No aircraft types available for DEAD')
    return
  }

  // Find enemy SAM groups that are not destroyed and not already targeted
  const enemySamGroups = draft.coalitions[enemyCoalition].samGroups.filter(
    (sam) => !sam.destroyed && !targetedSamIds.has(sam.id)
  )

  if (enemySamGroups.length === 0) {
    debugLog('No valid SAM targets for DEAD')
    return
  }

  const homeBases = getCoalitionAirdromes(draft, theatre, coalition)
  const availableTargets: Array<{
    target: { id: string; type: z.infer<typeof schemas.samType>; objectiveId: string }
    position: z.infer<typeof schemas.position>
  }> = []

  for (const samGroup of enemySamGroups) {
    const samPosition = getObjectivePosition(theatre, samGroup.objectiveId)
    if (!samPosition) {
      continue
    }
    availableTargets.push({
      target: {
        id: samGroup.id,
        type: samGroup.type,
        objectiveId: samGroup.objectiveId
      },
      position: samPosition
    })
  }

  const selectedAssignment = selectHomeBaseAndTarget({
    homeBases,
    targets: availableTargets,
    maxDistance: config.packages.DEAD.maxDistance
  })

  // If no suitable pair found, return
  if (!selectedAssignment) {
    debugLog('No suitable home base and SAM target pair found within range')
    return
  }

  // Check airbase supply status
  const spawnModifier = getAirbaseSpawnModifier(draft, coalition, selectedAssignment.homeBase.name)
  if (Math.random() > spawnModifier) {
    debugLog(`Skipping DEAD spawn due to supply status at ${selectedAssignment.homeBase.name}`)
    return
  }

  // Select a random aircraft type
  const selectedAircraftType = pickRandomAircraftType(availableAircraftTypes)
  if (!selectedAircraftType) {
    debugLog('No valid aircraft type selected')
    return
  }
  const aircraftType = selectedAircraftType

  // Spawn DEAD flight
  DeadFlightGroup.spawn(draft, coalition, {
    homeBase: selectedAssignment.homeBase.name,
    homeBasePosition: selectedAssignment.homeBase.position,
    target: selectedAssignment.target,
    targetPosition: selectedAssignment.targetPosition,
    runwayAngle: selectedAssignment.homeBase.runwayAngle,
    aircraftType
  })
}
