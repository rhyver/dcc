import { schemas, config } from '@dcc/contracts'
import * as z from 'zod'
import { CapFlightGroup } from '../../../entities/cap-flight-group'
import { FlightGroupFactory } from '../../../entities/flight-group-factory'
import {
  getCoalitionAirdromes,
  pickRandomAircraftType,
  resolveSpawnContext,
  selectCapPatrolAssignment
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

export function spawnCap(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  const flightGroups = FlightGroupFactory.getCoalitionFlightGroups(draft, coalition)

  const capGroups = flightGroups.filter((group) => group.task === 'CAP')
  const automaticCapGroups = capGroups.filter((group) => group.spawnSource !== 'manual')

  debugLog(`${coalition}: CAP groups`, capGroups.length)

  if (automaticCapGroups.length >= config.packages.CAP.maxActive[coalition]) {
    return
  }

  const context = resolveSpawnContext(draft, coalition)
  if (!context) {
    return
  }
  const { theatre, enemyCoalition } = context

  // Get available aircraft types for CAP missions
  const availableAircraftTypes = draft.coalitions[coalition].aircraftTypes['CAP']
  if (!availableAircraftTypes || availableAircraftTypes.length === 0) {
    debugLog('No aircraft types available for CAP')
    return
  }

  const homeBases = getCoalitionAirdromes(draft, theatre, coalition)
  const enemyAirdromes = getCoalitionAirdromes(draft, theatre, enemyCoalition)

  // Find airdrome pairs that are already covered by CAP
  const coveredAirdromes = new Set(automaticCapGroups.map((g) => g.homeBase))

  const selectedPatrolAssignment = selectCapPatrolAssignment({
    homeBases,
    enemyAirdromes,
    coveredHomeBases: coveredAirdromes,
    maxHomeToEnemyDistance: config.packages.CAP.maxDistance * 2
  })

  // If no suitable airdrome found, return
  if (!selectedPatrolAssignment) {
    debugLog('No suitable home base found for CAP')
    return
  }

  // Check airbase supply status
  const spawnModifier = getAirbaseSpawnModifier(
    draft,
    coalition,
    selectedPatrolAssignment.homeBase.name
  )
  if (Math.random() > spawnModifier) {
    debugLog(`Skipping CAP spawn due to supply status at ${selectedPatrolAssignment.homeBase.name}`)
    return
  }

  // Select a random aircraft type
  const selectedAircraftType = pickRandomAircraftType(availableAircraftTypes)
  if (!selectedAircraftType) {
    debugLog('No valid aircraft type selected')
    return
  }
  const aircraftType = selectedAircraftType

  // Spawn CAP flight
  CapFlightGroup.spawn(draft, coalition, {
    homeBase: selectedPatrolAssignment.homeBase.name,
    homeBasePosition: selectedPatrolAssignment.homeBase.position,
    patrolCenter: selectedPatrolAssignment.patrolCenter,
    runwayAngle: selectedPatrolAssignment.homeBase.runwayAngle,
    aircraftType
  })
}
