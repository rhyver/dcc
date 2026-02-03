import { schemas, config } from '@dcc/contracts'
import * as z from 'zod'
import { scenarios, theatres } from '@dcc/data'
import { DeadFlightGroup } from '../../../entities/dead-flight-group'
import { FlightGroupFactory } from '../../../entities/flight-group-factory'
import { getObjectivePosition } from '@/logic/utils/get-objective-position'
import { calculateDistance } from '@/logic/utils/calculate-distance'

export function spawnDead(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  const flightGroups = FlightGroupFactory.getCoalitionFlightGroups(draft, coalition)

  const deadGroups = flightGroups.filter((group) => group.task === 'DEAD')

  console.log(`${coalition}: DEAD groups`, deadGroups.length)

  if (deadGroups.length >= config.packages.DEAD.maxActive[coalition]) {
    return
  }

  // Get targeted SAM IDs to avoid double-targeting
  const targetedSamIds = new Set(
    deadGroups.map((g) => g.target?.id).filter((id): id is string => !!id)
  )

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

  // Get available aircraft types for DEAD missions
  const availableAircraftTypes = draft.coalitions[coalition].aircraftTypes['DEAD']
  if (!availableAircraftTypes || availableAircraftTypes.length === 0) {
    console.log('No aircraft types available for DEAD')
    return
  }

  // Find enemy SAM groups that are not destroyed and not already targeted
  const enemySamGroups = draft.coalitions[enemyCoalition].samGroups.filter(
    (sam) => !sam.destroyed && !targetedSamIds.has(sam.id)
  )

  if (enemySamGroups.length === 0) {
    console.log('No valid SAM targets for DEAD')
    return
  }

  // Find a suitable home base and SAM target within range
  const homeBaseNames = draft.coalitions[coalition].airdromeNames

  let selectedHomeBase: string | null = null
  let selectedTarget: {
    id: string
    type: string
    objectiveId: string
  } | null = null
  let homeBasePosition: z.infer<typeof schemas.position> | null = null
  let targetPosition: z.infer<typeof schemas.position> | null = null

  // Iterate through home bases and SAM targets to find a suitable pair
  homeBaseLoop: for (const homeBaseName of homeBaseNames) {
    const airdromeDetail = theatre.airdromeDetails[homeBaseName]
    if (!airdromeDetail) {
      continue
    }

    const homePos: z.infer<typeof schemas.position> = {
      x: airdromeDetail.x,
      y: airdromeDetail.y
    }

    for (const samGroup of enemySamGroups) {
      const samPosition = getObjectivePosition(theatre, samGroup.objectiveId)
      if (!samPosition) {
        continue
      }

      const distance = calculateDistance(homePos, samPosition)

      if (distance <= config.packages.DEAD.maxDistance) {
        selectedHomeBase = homeBaseName
        selectedTarget = {
          id: samGroup.id,
          type: samGroup.type,
          objectiveId: samGroup.objectiveId
        }
        homeBasePosition = homePos
        targetPosition = samPosition
        break homeBaseLoop
      }
    }
  }

  // If no suitable pair found, return
  if (!selectedHomeBase || !selectedTarget || !homeBasePosition || !targetPosition) {
    console.log('No suitable home base and SAM target pair found within range')
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

  // Spawn DEAD flight
  DeadFlightGroup.spawn(draft, coalition, {
    homeBase: selectedHomeBase,
    homeBasePosition,
    target: selectedTarget,
    targetPosition,
    runwayAngle: theatre.airdromeDetails[selectedHomeBase]?.runwayAngle,
    aircraftType
  })
}
