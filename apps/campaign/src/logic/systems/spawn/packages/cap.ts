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

export function spawnCap(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  const flightGroups = FlightGroupFactory.getCoalitionFlightGroups(draft, coalition)

  const capGroups = flightGroups.filter((group) => group.task === 'CAP')

  console.log(`${coalition}: CAP groups`, capGroups.length)

  if (capGroups.length >= config.packages.CAP.maxActive[coalition]) {
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
    console.log('No aircraft types available for CAP')
    return
  }

  const homeBases = getCoalitionAirdromes(draft, theatre, coalition)
  const enemyAirdromes = getCoalitionAirdromes(draft, theatre, enemyCoalition)

  // Find airdrome pairs that are already covered by CAP
  const coveredAirdromes = new Set(capGroups.map((g) => g.homeBase))

  const selectedPatrolAssignment = selectCapPatrolAssignment({
    homeBases,
    enemyAirdromes,
    coveredHomeBases: coveredAirdromes,
    maxHomeToEnemyDistance: config.packages.CAP.maxDistance * 2
  })

  // If no suitable airdrome found, return
  if (!selectedPatrolAssignment) {
    console.log('No suitable home base found for CAP')
    return
  }

  // Select a random aircraft type
  const selectedAircraftType = pickRandomAircraftType(availableAircraftTypes)
  if (!selectedAircraftType) {
    console.log('No valid aircraft type selected')
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
