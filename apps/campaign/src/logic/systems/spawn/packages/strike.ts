import { schemas, config } from '@dcc/contracts'
import * as z from 'zod'
import { StrikeFlightGroup } from '../../../entities/strike-flight-group'
import { SeadFlightGroup } from '../../../entities/sead-flight-group'
import { FlightGroupFactory } from '../../../entities/flight-group-factory'
import { getObjectivePosition } from '@/logic/utils/get-objective-position'
import { getClosestThreateningSam } from '@/logic/utils/threat-analyzer'
import {
  getCoalitionAirdromes,
  pickRandomAircraftType,
  resolveSpawnContext,
  selectHomeBaseAndTarget
} from './common'
import { getNodeSupply } from '../../update-supply'

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
      return 0.5   // Half sortie rate
    case 'depleted':
      return 0     // No sorties
  }
}

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

  const context = resolveSpawnContext(draft, coalition)
  if (!context) {
    return
  }
  const { theatre, enemyCoalition } = context

  // Get available aircraft types for strike missions
  const availableAircraftTypes = draft.coalitions[coalition].aircraftTypes['Pinpoint Strike']
  if (!availableAircraftTypes || availableAircraftTypes.length === 0) {
    console.log('No aircraft types available for Pinpoint Strike')
    return
  }

  // Find a suitable home base and target within range
  const homeBases = getCoalitionAirdromes(draft, theatre, coalition)
  const enemyStructures = draft.coalitions[enemyCoalition].structures
  const availableTargets: Array<{
    target: (typeof enemyStructures)[number]
    position: z.infer<typeof schemas.position>
  }> = []

  for (const structure of enemyStructures) {
    if (targetedObjectiveIds.has(structure.objectiveId)) {
      continue
    }
    const position = getObjectivePosition(theatre, structure.objectiveId)
    if (!position) {
      continue
    }
    availableTargets.push({ target: structure, position })
  }

  const selectedAssignment = selectHomeBaseAndTarget({
    homeBases,
    targets: availableTargets,
    maxDistance: config.packages['Pinpoint Strike'].maxDistance
  })

  // If no suitable pair found, return
  if (!selectedAssignment) {
    console.log('No suitable home base and target pair found within range')
    return
  }
  const selectedTarget = selectedAssignment.target

  // Check airbase supply status
  const spawnModifier = getAirbaseSpawnModifier(draft, coalition, selectedAssignment.homeBase.name)
  if (Math.random() > spawnModifier) {
    console.log(`Skipping strike spawn due to supply status at ${selectedAssignment.homeBase.name}`)
    return
  }

  // Select a random aircraft type
  const selectedAircraftType = pickRandomAircraftType(availableAircraftTypes)
  if (!selectedAircraftType) {
    console.log('No valid aircraft type selected')
    return
  }
  const aircraftType = selectedAircraftType

  // Check for threatening SAMs
  const enemySamGroups = draft.coalitions[enemyCoalition].samGroups
  const threateningSam = getClosestThreateningSam(
    selectedAssignment.targetPosition,
    enemySamGroups,
    theatre,
    draft,
    enemyCoalition
  )

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
        homeBase: selectedAssignment.homeBase.name,
        homeBasePosition: selectedAssignment.homeBase.position,
        target: selectedTarget,
        targetPosition: selectedAssignment.targetPosition,
        runwayAngle: selectedAssignment.homeBase.runwayAngle,
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
      homeBase: selectedAssignment.homeBase.name,
      homeBasePosition: selectedAssignment.homeBase.position,
      target: {
        id: threateningSam.samGroup.id,
        type: threateningSam.samGroup.type,
        objectiveId: threateningSam.samGroup.objectiveId
      },
      targetPosition: threateningSam.position,
      runwayAngle: selectedAssignment.homeBase.runwayAngle,
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
      homeBase: selectedAssignment.homeBase.name,
      homeBasePosition: selectedAssignment.homeBase.position,
      target: selectedTarget,
      targetPosition: selectedAssignment.targetPosition,
      runwayAngle: selectedAssignment.homeBase.runwayAngle,
      aircraftType
    })
  }
}
