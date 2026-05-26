import { produce } from 'immer'
import { schemas } from '@dcc/contracts'
import { samTemplates } from '@dcc/data'
import * as z from 'zod'

import { FlightGroup } from '@/logic/entities/flight-group'
import { updatePackages } from '@/logic/systems/update-packages'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type MissionState = z.infer<typeof schemas.missionState>
type Coalition = 'player' | 'opponent'
type MissionAircraftGroup = NonNullable<MissionState['groupPositions']>['blue']['aircraft'][number]
type MissionAircraftUnit = MissionAircraftGroup['units'][number]

function campaignDateFromMissionTime(campaignTime: Date, missionTimeSeconds?: number): Date | null {
  if (missionTimeSeconds == null || !Number.isFinite(missionTimeSeconds)) {
    return null
  }

  const campaignDate = new Date(campaignTime)
  const midnightUtc = Date.UTC(
    campaignDate.getUTCFullYear(),
    campaignDate.getUTCMonth(),
    campaignDate.getUTCDate()
  )
  const missionDate = new Date(midnightUtc + missionTimeSeconds * 1000)

  while (missionDate < campaignDate) {
    missionDate.setUTCDate(missionDate.getUTCDate() + 1)
  }

  return missionDate
}

function getGeneratedUnitIndex(unitName: string): number | null {
  const match = unitName.match(/-(\d+)$/)
  if (!match?.[1]) return null

  const index = Number.parseInt(match[1], 10)
  return Number.isFinite(index) ? index - 1 : null
}

function getGeneratedGroundGroupId(name: string): string | null {
  const match = name.match(/^Ground-(.+)-\d+(?:-\d+)?$/)
  return match?.[1] ?? null
}

function addLostSamUnitIndex(
  sam: Campaign['coalitions']['player']['samGroups'][number],
  lostUnit: MissionState['lostUnits'][number],
  deadUnitIndexes: Set<number>
): boolean {
  const namePrefix = `SAM-${sam.id}-`
  const groupName = lostUnit.groupName ?? undefined

  if (!lostUnit.name.startsWith(namePrefix) && !groupName?.startsWith(namePrefix)) {
    return false
  }

  const generatedIndex = getGeneratedUnitIndex(lostUnit.name)
  if (generatedIndex != null) {
    deadUnitIndexes.add(generatedIndex)
    return true
  }

  const template = samTemplates[sam.type]
  const typeIndex = template?.units.findIndex(
    (unitType, index) => unitType === lostUnit.type && !deadUnitIndexes.has(index)
  )
  if (typeIndex != null && typeIndex >= 0) {
    deadUnitIndexes.add(typeIndex)
    return true
  }

  return true
}

function syncGroundGroupsFromMissionState(
  draft: Campaign,
  coalition: Coalition,
  groups?: Array<{ name: string; x: number; y: number; units: Array<{ type: string }> }>
) {
  if (!groups) {
    return
  }

  const groupsById = new Map<string, NonNullable<typeof groups>[number]>()
  for (const group of groups) {
    const id = getGeneratedGroundGroupId(group.name)
    if (id) {
      groupsById.set(id, group)
    }
  }

  for (const groundGroup of draft.coalitions[coalition].groundGroups) {
    const missionGroup = groupsById.get(groundGroup.id)
    if (!missionGroup) {
      groundGroup.units = []
      continue
    }

    groundGroup.position.x = missionGroup.x
    groundGroup.position.y = missionGroup.y

    const countsByType = new Map<string, number>()
    for (const unit of missionGroup.units) {
      countsByType.set(unit.type, (countsByType.get(unit.type) ?? 0) + 1)
    }

    groundGroup.units = Array.from(countsByType, ([name, count]) => ({ name, count }))
  }

  draft.coalitions[coalition].groundGroups = draft.coalitions[coalition].groundGroups.filter(
    (groundGroup) => groundGroup.units.reduce((sum, unit) => sum + Math.max(0, unit.count), 0) > 0
  )
}

function getAircraftStateNames(
  flightGroup: Campaign['coalitions']['player']['flightGroups'][number]
) {
  return flightGroup.aircrafts.map((aircraft, index) => ({
    aircraftId: aircraft.id,
    client: aircraft.client === true,
    names: [aircraft.unitName, `${flightGroup.callsign}-${index + 1}`]
  }))
}

function createMissionUnitLookup(group?: MissionAircraftGroup) {
  const unitsByName = new Map<string, MissionAircraftUnit>()
  for (const unit of group?.units ?? []) {
    unitsByName.set(unit.name, unit)
  }
  return unitsByName
}

function hasNameInSet(names: string[], set: Set<string>) {
  return names.some((name) => set.has(name))
}

function isAircraftCurrentlyAirborne(
  names: string[],
  unitsByName: Map<string, MissionAircraftUnit>
) {
  return names.some((name) => unitsByName.get(name)?.inAir === true)
}

function isAircraftTerminal(
  names: string[],
  lostUnitNames: Set<string>,
  landedUnitNames: Set<string>,
  missionUnitsByName: Map<string, MissionAircraftUnit>
) {
  if (hasNameInSet(names, lostUnitNames)) {
    return true
  }

  return (
    hasNameInSet(names, landedUnitNames) &&
    !isAircraftCurrentlyAirborne(names, missionUnitsByName)
  )
}

function areAllClientAircraftTerminal(
  aircraftStates: ReturnType<typeof getAircraftStateNames>,
  lostUnitNames: Set<string>,
  landedUnitNames: Set<string>,
  missionUnitsByName: Map<string, MissionAircraftUnit>
) {
  const clientStates = aircraftStates.filter((state) => state.client)
  if (clientStates.length === 0) {
    return false
  }

  return clientStates.every((state) =>
    isAircraftTerminal(state.names, lostUnitNames, landedUnitNames, missionUnitsByName)
  )
}

function applyToCoalition(
  draft: Campaign,
  coalition: Coalition,
  groups: MissionAircraftGroup[] | undefined,
  lostUnitNames: Set<string>,
  landedUnitNames: Set<string>,
  cargoDeliveries: MissionState['cargoDeliveries']
) {
  const transportDeliveryRadiusMeters = 2000

  const isNearTransportDestination = (
    flightGroup: Campaign['coalitions']['player']['flightGroups'][number],
    delivery: { x: number; y: number }
  ) => {
    const directWaypoint = flightGroup.flightplan.waypoints.find(
      (waypoint) => waypoint.name === 'Direct'
    )
    const lastWaypoint =
      flightGroup.flightplan.waypoints.length > 0
        ? flightGroup.flightplan.waypoints[flightGroup.flightplan.waypoints.length - 1]
        : undefined
    const destination = directWaypoint?.position ?? lastWaypoint?.position
    if (!destination) return false

    const dx = destination.x - delivery.x
    const dy = destination.y - delivery.y
    return Math.hypot(dx, dy) <= transportDeliveryRadiusMeters
  }

  const groupByName = new Map((groups ?? []).map((group) => [group.name, group]))
  const finishedFlightGroupIds = new Set<string>()

  for (const flightGroup of draft.coalitions[coalition].flightGroups) {
    const missionGroup = groupByName.get(flightGroup.callsign)
    if (missionGroup) {
      flightGroup.position.x = missionGroup.x
      flightGroup.position.y = missionGroup.y
    }

    const missionUnitsByName = createMissionUnitLookup(missionGroup)
    const aircraftStateNames = getAircraftStateNames(flightGroup)
    const terminalAircraftIds = new Set<string>()

    for (const aircraftState of aircraftStateNames) {
      if (
        isAircraftTerminal(
          aircraftState.names,
          lostUnitNames,
          landedUnitNames,
          missionUnitsByName
        )
      ) {
        terminalAircraftIds.add(aircraftState.aircraftId)
      }
    }

    if (terminalAircraftIds.size > 0) {
      flightGroup.aircrafts = flightGroup.aircrafts.filter(
        (aircraft) => !terminalAircraftIds.has(aircraft.id)
      )
    }

    if (
      areAllClientAircraftTerminal(
        aircraftStateNames,
        lostUnitNames,
        landedUnitNames,
        missionUnitsByName
      )
    ) {
      flightGroup.aircrafts = []
    }

    if (new FlightGroup(flightGroup).isLanded(draft.time)) {
      flightGroup.aircrafts = []
    }

    if (flightGroup.task === 'Transport') {
      const delivery = cargoDeliveries[flightGroup.callsign]
      if (
        delivery &&
        flightGroup.cargoStatus !== 'delivered' &&
        flightGroup.cargoStatus !== 'lost' &&
        flightGroup.destinationNode &&
        flightGroup.cargoAmount &&
        isNearTransportDestination(flightGroup, delivery)
      ) {
        const destinationSupplyNode =
          draft.coalitions[coalition].supplyNodes?.[flightGroup.destinationNode]
        if (destinationSupplyNode) {
          destinationSupplyNode.current += flightGroup.cargoAmount
        }

        flightGroup.position.x = delivery.x
        flightGroup.position.y = delivery.y
        flightGroup.cargoStatus = 'delivered'
      }
    }

    if (flightGroup.aircrafts.length === 0) {
      finishedFlightGroupIds.add(flightGroup.id)
      continue
    }
  }

  if (finishedFlightGroupIds.size > 0) {
    draft.coalitions[coalition].flightGroups = draft.coalitions[coalition].flightGroups.filter(
      (flightGroup) => !finishedFlightGroupIds.has(flightGroup.id)
    )
  }
}

export function applyMissionStateUpdate(campaign: Campaign, missionState: MissionState): Campaign {
  const lostUnits = missionState.lostUnits ?? []
  const landedUnits = missionState.landedUnits ?? []
  const lostUnitNames = new Set(lostUnits.map((unit) => unit.name))
  const landedUnitNames = new Set(landedUnits.map((unit) => unit.name))
  const groupPositions = missionState.groupPositions
  const cargoDeliveries = missionState.cargoDeliveries ?? {}

  return produce(campaign, (draft) => {
    const missionDate = campaignDateFromMissionTime(draft.time, missionState.time)
    if (missionDate) {
      draft.time = missionDate
      draft.timeTarget = undefined
    }

    applyToCoalition(
      draft,
      'player',
      groupPositions?.blue?.aircraft,
      lostUnitNames,
      landedUnitNames,
      cargoDeliveries
    )
    applyToCoalition(
      draft,
      'opponent',
      groupPositions?.red?.aircraft,
      lostUnitNames,
      landedUnitNames,
      cargoDeliveries
    )
    syncGroundGroupsFromMissionState(draft, 'player', groupPositions?.blue?.ground)
    syncGroundGroupsFromMissionState(draft, 'opponent', groupPositions?.red?.ground)

    if (lostUnitNames.size > 0) {
      for (const coalition of ['player', 'opponent'] as const) {
        for (const sam of draft.coalitions[coalition].samGroups) {
          const deadUnitIndexes = new Set(sam.deadUnitIndexes ?? [])
          let sawLostSamUnit = false

          for (const lostUnit of lostUnits) {
            sawLostSamUnit = addLostSamUnitIndex(sam, lostUnit, deadUnitIndexes) || sawLostSamUnit
          }

          if (deadUnitIndexes.size > 0) {
            sam.deadUnitIndexes = [...deadUnitIndexes].sort((a, b) => a - b)
          }

          const template = samTemplates[sam.type]
          if (template && template.units.every((_, index) => deadUnitIndexes.has(index))) {
            sam.destroyed = true
          } else if (sawLostSamUnit) {
            sam.destroyed = false
          }
        }

        for (const structure of draft.coalitions[coalition].structures) {
          const namePrefix = `Static-${structure.id}-`
          for (const lostUnitName of lostUnitNames) {
            if (!lostUnitName.startsWith(namePrefix)) continue

            const buildingIndex = getGeneratedUnitIndex(lostUnitName)
            const building = buildingIndex != null ? structure.buildings[buildingIndex] : undefined
            if (building) {
              building.alive = false
            }
          }
        }
      }
    }

    updatePackages(draft, 'player')
    updatePackages(draft, 'opponent')
  })
}
