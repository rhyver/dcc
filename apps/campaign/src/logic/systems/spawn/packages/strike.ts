import { schemas, config } from '@dcc/contracts'
import * as z from 'zod'
import { scenarios, theatres } from '@dcc/data'
import { FlightGroup } from '../../../entities/flight-group'
import { StrikeFlightGroup } from '../../../entities/strike-flight-group'
import { getObjectivePosition } from '@/logic/utils/get-objective-position'
import { calculateDistance } from '@/logic/utils/calculate-distance'

export function spawnStrike(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  const flightGroups = FlightGroup.getCoalitionFlightGroups(draft, coalition)

  const strikeGroups = flightGroups.filter((group) => group.task === 'Pinpoint Strike')

  console.log(`${coalition}: strike groups`, strikeGroups.length)

  if (strikeGroups.length >= config.packages['Pinpoint Strike'].maxActive[coalition]) {
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

  // Determine enemy coalition
  const enemyCoalition: z.infer<typeof schemas.coalition> =
    coalition === 'player' ? 'opponent' : 'player'

  // Get available aircraft types for strike missions
  const availableAircraftTypes = draft.coalitions[coalition].aircraftTypes['Pinpoint Strike']
  if (!availableAircraftTypes || availableAircraftTypes.length === 0) {
    console.log('No aircraft types available for Pinpoint Strike')
    return
  }

  // Find a suitable home base and target within range
  const homeBaseNames = draft.coalitions[coalition].airdromeNames
  const enemyStructures = draft.coalitions[enemyCoalition].structures

  let selectedHomeBase: string | null = null
  let selectedTarget: {
    id: string
    type: string
    objectiveId: string
  } | null = null
  let homeBasePosition: z.infer<typeof schemas.position> | null = null
  let targetPosition: z.infer<typeof schemas.position> | null = null

  // Iterate through home bases and targets to find a suitable pair
  homeBaseLoop: for (const homeBaseName of homeBaseNames) {
    const airdromeDetail = theatre.airdromeDetails[homeBaseName]
    if (!airdromeDetail) {
      continue
    }

    const homePos: z.infer<typeof schemas.position> = {
      x: airdromeDetail.x,
      y: airdromeDetail.y
    }

    for (const structure of enemyStructures) {
      const structureObjectivePos = getObjectivePosition(theatre, structure.objectiveId)
      if (!structureObjectivePos) {
        continue
      }

      const distance = calculateDistance(homePos, structureObjectivePos)

      if (distance <= config.packages['Pinpoint Strike'].maxDistance) {
        selectedHomeBase = homeBaseName
        selectedTarget = structure
        homeBasePosition = homePos
        targetPosition = structureObjectivePos
        break homeBaseLoop
      }
    }
  }

  // If no suitable pair found, return
  if (!selectedHomeBase || !selectedTarget || !homeBasePosition || !targetPosition) {
    console.log('No suitable home base and target pair found within range')
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

  // Use StrikeFlightGroup.spawn to create and add the flight group
  StrikeFlightGroup.spawn(draft, coalition, {
    homeBase: selectedHomeBase,
    homeBasePosition,
    target: selectedTarget,
    targetPosition,
    aircraftType
  })
}
