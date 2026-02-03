import { schemas, config } from '@dcc/contracts'
import * as z from 'zod'
import { scenarios, theatres } from '@dcc/data'
import { CapFlightGroup } from '../../../entities/cap-flight-group'
import { FlightGroupFactory } from '../../../entities/flight-group-factory'
import { calculateDistance } from '@/logic/utils/calculate-distance'

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

  // Get scenario and theatre data
  const scenario = scenarios.find((s) => s.id === draft.scenarioId)
  if (!scenario) {
    console.error('Scenario not found:', draft.scenarioId)
    return
  }

  const theatre = theatres.find((t) => t.name === scenario.theatreName)
  if (!theatre) {
    console.error('Theatre not found:', scenario.theatreName)
    return
  }

  // Get available aircraft types for CAP missions
  const availableAircraftTypes = draft.coalitions[coalition].aircraftTypes['CAP']
  if (!availableAircraftTypes || availableAircraftTypes.length === 0) {
    console.log('No aircraft types available for CAP')
    return
  }

  // Get our airdromes
  const homeBaseNames = draft.coalitions[coalition].airdromeNames

  // Determine enemy coalition
  const enemyCoalition: z.infer<typeof schemas.coalition> =
    coalition === 'player' ? 'opponent' : 'player'

  // Get enemy airdrome positions to patrol towards
  const enemyAirdromeNames = draft.coalitions[enemyCoalition].airdromeNames

  // Find airdrome pairs that are already covered by CAP
  const coveredAirdromes = new Set(capGroups.map((g) => g.homeBase))

  let selectedHomeBase: string | null = null
  let homeBasePosition: z.infer<typeof schemas.position> | null = null
  let patrolCenter: z.infer<typeof schemas.position> | null = null

  // Find an airdrome without CAP coverage
  for (const homeBaseName of homeBaseNames) {
    if (coveredAirdromes.has(homeBaseName)) {
      continue
    }

    const airdromeDetail = theatre.airdromeDetails[homeBaseName]
    if (!airdromeDetail) {
      continue
    }

    const homePos: z.infer<typeof schemas.position> = {
      x: airdromeDetail.x,
      y: airdromeDetail.y
    }

    // Find nearest enemy airdrome to determine patrol direction
    let nearestEnemyDistance = Infinity
    let nearestEnemyPos: z.infer<typeof schemas.position> | null = null

    for (const enemyAirdromeName of enemyAirdromeNames) {
      const enemyAirdromeDetail = theatre.airdromeDetails[enemyAirdromeName]
      if (!enemyAirdromeDetail) {
        continue
      }

      const enemyPos: z.infer<typeof schemas.position> = {
        x: enemyAirdromeDetail.x,
        y: enemyAirdromeDetail.y
      }

      const distance = calculateDistance(homePos, enemyPos)
      if (distance < nearestEnemyDistance) {
        nearestEnemyDistance = distance
        nearestEnemyPos = enemyPos
      }
    }

    if (nearestEnemyPos && nearestEnemyDistance <= config.packages.CAP.maxDistance * 2) {
      selectedHomeBase = homeBaseName
      homeBasePosition = homePos

      // Patrol center is 30-50km towards the enemy
      const dx = nearestEnemyPos.x - homePos.x
      const dy = nearestEnemyPos.y - homePos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const ux = dx / distance
      const uy = dy / distance

      const patrolDistance = Math.min(50000, distance * 0.3) // 30% of the way or max 50km
      patrolCenter = {
        x: homePos.x + ux * patrolDistance,
        y: homePos.y + uy * patrolDistance
      }
      break
    }
  }

  // If no suitable airdrome found, return
  if (!selectedHomeBase || !homeBasePosition || !patrolCenter) {
    console.log('No suitable home base found for CAP')
    return
  }

  // Select a random aircraft type
  const selectedAircraftType =
    availableAircraftTypes[Math.floor(Math.random() * availableAircraftTypes.length)]

  // Validate that the aircraft type is valid
  if (!selectedAircraftType) {
    console.log('No valid aircraft type selected')
    return
  }

  const aircraftType = selectedAircraftType as z.infer<typeof schemas.dcs.aircraftName>

  // Spawn CAP flight
  CapFlightGroup.spawn(draft, coalition, {
    homeBase: selectedHomeBase,
    homeBasePosition,
    patrolCenter,
    runwayAngle: theatre.airdromeDetails[selectedHomeBase]?.runwayAngle,
    aircraftType
  })
}
