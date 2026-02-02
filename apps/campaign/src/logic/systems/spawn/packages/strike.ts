import { schemas, config } from '@dcc/contracts'
import * as z from 'zod'
import { scenarios, theatres } from '@dcc/data'
import { StrikeFlightGroup } from '../../../entities/strike-flight-group'
import { SeadFlightGroup } from '../../../entities/sead-flight-group'
import { FlightGroupFactory } from '../../../entities/flight-group-factory'
import { getObjectivePosition } from '@/logic/utils/get-objective-position'
import { calculateDistance } from '@/logic/utils/calculate-distance'
import { getClosestThreateningSam } from '@/logic/utils/threat-analyzer'

export function spawnStrike(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  const flightGroups = FlightGroupFactory.getCoalitionFlightGroups(draft, coalition)

  const strikeGroups = flightGroups.filter((group) => group.task === 'Pinpoint Strike')

  console.log(`${coalition}: strike groups`, strikeGroups.length)

  if (strikeGroups.length >= config.packages['Pinpoint Strike'].maxActive[coalition]) {
    return
  }

  const targetedObjectiveIds = new Set(
    strikeGroups.map((g) => g.target?.objectiveId).filter((id): id is string => !!id)
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
      if (targetedObjectiveIds.has(structure.objectiveId)) {
        continue
      }

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

  // Check for threatening SAMs
  const enemySamGroups = draft.coalitions[enemyCoalition].samGroups
  const threateningSam = getClosestThreateningSam(targetPosition, enemySamGroups, theatre)

  // Check if SEAD aircraft are available
  const availableSeadAircraftTypes = draft.coalitions[coalition].aircraftTypes['SEAD']
  const seadGroups = flightGroups.filter((group) => group.task === 'SEAD')
  const canSpawnSead =
    availableSeadAircraftTypes &&
    availableSeadAircraftTypes.length > 0 &&
    seadGroups.length < config.packages.SEAD.maxActive[coalition]

  if (threateningSam && canSpawnSead) {
    // Create a strike package with SEAD support
    const packageId = crypto.randomUUID()

    // First spawn the strike to get its ToT
    const { flightGroupId: strikeFlightGroupId, tot: strikeTot } = StrikeFlightGroup.spawn(
      draft,
      coalition,
      {
        homeBase: selectedHomeBase,
        homeBasePosition,
        target: selectedTarget,
        targetPosition,
        runwayAngle: theatre.airdromeDetails[selectedHomeBase]?.runwayAngle,
        aircraftType,
        packageId
      }
    )

    // SEAD ToT = Strike ToT - lead time (2 minutes before)
    const seadTot = new Date(strikeTot.getTime() - config.packages.SEAD.leadTime)

    // Select SEAD aircraft type
    const seadAircraftType = availableSeadAircraftTypes[
      Math.floor(Math.random() * availableSeadAircraftTypes.length)
    ] as z.infer<typeof schemas.dcs.aircraftName>

    // Spawn SEAD flight targeting the threatening SAM
    const seadFlightGroupId = SeadFlightGroup.spawn(draft, coalition, {
      homeBase: selectedHomeBase,
      homeBasePosition,
      target: {
        id: threateningSam.samGroup.id,
        type: threateningSam.samGroup.type,
        objectiveId: threateningSam.samGroup.objectiveId
      },
      targetPosition: threateningSam.position,
      runwayAngle: theatre.airdromeDetails[selectedHomeBase]?.runwayAngle,
      aircraftType: seadAircraftType,
      tot: seadTot,
      packageId
    })

    // Create the package
    const missionPackage: z.infer<typeof schemas.missionPackage> = {
      id: packageId,
      type: 'SEAD Strike Package',
      targetObjectiveId: selectedTarget.objectiveId,
      members: [
        {
          flightGroupId: strikeFlightGroupId,
          role: 'primary',
          totOffset: 0
        },
        {
          flightGroupId: seadFlightGroupId,
          role: 'sead',
          totOffset: -config.packages.SEAD.leadTime
        }
      ],
      tot: strikeTot,
      status: 'active'
    }

    draft.coalitions[coalition].packages.push(missionPackage)

    console.log(
      `Created SEAD Strike Package: Strike + SEAD targeting ${threateningSam.samGroup.type}`
    )
  } else {
    // Spawn strike without SEAD support
    StrikeFlightGroup.spawn(draft, coalition, {
      homeBase: selectedHomeBase,
      homeBasePosition,
      target: selectedTarget,
      targetPosition,
      runwayAngle: theatre.airdromeDetails[selectedHomeBase]?.runwayAngle,
      aircraftType
    })
  }
}
