import { config, schemas } from '@dcc/contracts'
import { scenarios, theatres } from '@dcc/data'
import * as z from 'zod'

import { logCampaignAction } from '../simulation-log'
import { calculateDistance } from '../utils/calculate-distance'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type MissionState = z.infer<typeof schemas.missionState>
type DownedPilot = z.infer<typeof schemas.campaign.campaignDownedPilot>

function missionCoalitionToCampaignCoalition(
  coalition: MissionState['ejectedPilots'][number]['coalition']
): Coalition | null {
  if (coalition === 'blue' || coalition === 2) return 'player'
  if (coalition === 'red' || coalition === 1) return 'opponent'
  return null
}

function eventDate(campaignTime: Date, secondsAfterMidnight?: number): Date {
  if (secondsAfterMidnight == null || !Number.isFinite(secondsAfterMidnight)) {
    return new Date(campaignTime)
  }

  const event = new Date(
    Date.UTC(campaignTime.getUTCFullYear(), campaignTime.getUTCMonth(), campaignTime.getUTCDate()) +
      secondsAfterMidnight * 1000
  )
  while (event < campaignTime) event.setUTCDate(event.getUTCDate() + 1)
  return event
}

function createPilotId(coalition: Coalition, pilot: MissionState['ejectedPilots'][number]): string {
  return [
    'downed-pilot',
    coalition,
    encodeURIComponent(pilot.name),
    Math.round(pilot.time ?? 0),
    Math.round(pilot.x),
    Math.round(pilot.y)
  ].join('-')
}

function createCrashPilotId(
  coalition: Coalition,
  name: string,
  position: DownedPilot['position'],
  lostAt: Date
): string {
  return [
    'downed-pilot',
    coalition,
    'crash',
    encodeURIComponent(name),
    lostAt.getTime(),
    Math.round(position.x),
    Math.round(position.y)
  ].join('-')
}

function isBehindEnemyLines(
  campaign: Campaign,
  coalition: Coalition,
  position: DownedPilot['position']
) {
  const scenario = scenarios.find((candidate) => candidate.id === campaign.scenarioId)
  const theatre = scenario
    ? theatres.find((candidate) => candidate.name === scenario.theatreName)
    : undefined
  if (!theatre) return false

  const nearestObjective = [...theatre.objectives].sort(
    (left, right) =>
      calculateDistance(left.position, position) - calculateDistance(right.position, position)
  )[0]
  if (!nearestObjective) return false

  const enemyCoalition = coalition === 'player' ? 'opponent' : 'player'
  return campaign.coalitions[enemyCoalition].objectiveIds.includes(nearestObjective.name)
}

function isWithinRescueRange(
  campaign: Campaign,
  coalition: Coalition,
  position: DownedPilot['position']
) {
  const scenario = scenarios.find((candidate) => candidate.id === campaign.scenarioId)
  const theatre = scenario
    ? theatres.find((candidate) => candidate.name === scenario.theatreName)
    : undefined
  if (!theatre) return false

  const airdromePositions = campaign.coalitions[coalition].airdromeNames.flatMap((name) => {
    const airdrome = theatre.airdromeDetails[name]
    return airdrome ? [{ x: airdrome.x, y: airdrome.y }] : []
  })
  const farpPositions = campaign.coalitions[coalition].structures
    .filter((structure) => structure.type === 'Farp')
    .map((structure) => structure.position)

  return [...airdromePositions, ...farpPositions].some(
    (basePosition) => calculateDistance(basePosition, position) <= config.packages.CSAR.maxDistance
  )
}

function addDownedPilotIfEligible(
  draft: Campaign,
  coalition: Coalition,
  pilot: DownedPilot
): boolean {
  const allPilots = (['player', 'opponent'] as const).flatMap(
    (side) => draft.coalitions[side].downedPilots ?? []
  )
  if (allPilots.some((candidate) => candidate.id === pilot.id)) return false
  if (!isBehindEnemyLines(draft, coalition, pilot.position)) return false
  if (!isWithinRescueRange(draft, coalition, pilot.position)) return false

  const pilots = (draft.coalitions[coalition].downedPilots ??= [])
  pilots.push(pilot)
  logCampaignAction(draft, coalition, `${pilot.name} is down behind enemy lines`)
  return true
}

export function maybeCreateDownedPilotFromAircraftLoss(
  draft: Campaign,
  coalition: Coalition,
  loss: { name: string; position: DownedPilot['position']; lostAt?: Date },
  random: () => number = Math.random
): boolean {
  const lostAt = loss.lostAt ?? draft.time
  const pilot: DownedPilot = {
    id: createCrashPilotId(coalition, loss.name, loss.position, lostAt),
    name: loss.name,
    position: { ...loss.position },
    ejectedAt: new Date(lostAt)
  }

  if (!isBehindEnemyLines(draft, coalition, pilot.position)) return false
  if (!isWithinRescueRange(draft, coalition, pilot.position)) return false
  if (random() >= config.packages.CSAR.pilotSurvivalChance) return false

  return addDownedPilotIfEligible(draft, coalition, pilot)
}

export function syncDownedPilotsFromMissionState(
  draft: Campaign,
  missionState: MissionState,
  missionStartTime: Date
) {
  const rescuedIds = new Set((missionState.rescuedPilots ?? []).map((pilot) => pilot.pilotId))

  for (const coalition of ['player', 'opponent'] as const) {
    const pilots = draft.coalitions[coalition].downedPilots ?? []
    for (const pilot of pilots) {
      if (!rescuedIds.has(pilot.id)) continue
      const rescue = missionState.rescuedPilots?.find((event) => event.pilotId === pilot.id)
      const rescuer = rescue?.groupName ? `${rescue.groupName} rescued` : 'Rescued'
      logCampaignAction(draft, coalition, `${rescuer} ${pilot.name}`)
    }
    draft.coalitions[coalition].downedPilots = pilots.filter((pilot) => !rescuedIds.has(pilot.id))
  }

  for (const eventPilot of missionState.ejectedPilots) {
    const coalition = missionCoalitionToCampaignCoalition(eventPilot.coalition)
    if (!coalition) continue

    const id = createPilotId(coalition, eventPilot)
    const pilot: DownedPilot = {
      id,
      name: eventPilot.name,
      position: { x: eventPilot.x, y: eventPilot.y },
      ejectedAt: eventDate(missionStartTime, eventPilot.time)
    }
    addDownedPilotIfEligible(draft, coalition, pilot)
  }

  for (const lostUnit of missionState.lostUnits) {
    const coalition = missionCoalitionToCampaignCoalition(lostUnit.coalition)
    const isAircraft =
      lostUnit.categoryName === 'plane' ||
      lostUnit.categoryName === 'helicopter' ||
      lostUnit.category === 0 ||
      lostUnit.category === 1
    const crashed =
      lostUnit.crashed === true || lostUnit.event === 'crash' || lostUnit.lossType === 'crashed'

    if (!coalition || !isAircraft || !crashed || lostUnit.pilotEjected === true) continue

    const lostAt = eventDate(missionStartTime, lostUnit.time)
    const pilot: DownedPilot = {
      id: createCrashPilotId(coalition, lostUnit.name, { x: lostUnit.x, y: lostUnit.y }, lostAt),
      name: lostUnit.name,
      position: { x: lostUnit.x, y: lostUnit.y },
      ejectedAt: lostAt
    }

    if (lostUnit.pilotSurvivedCrash === true) {
      addDownedPilotIfEligible(draft, coalition, pilot)
    } else if (
      lostUnit.pilotSurvivedCrash == null &&
      isBehindEnemyLines(draft, coalition, pilot.position) &&
      isWithinRescueRange(draft, coalition, pilot.position) &&
      Math.random() < config.packages.CSAR.pilotSurvivalChance
    ) {
      // Backward compatibility for mission files generated before crash survival was recorded.
      addDownedPilotIfEligible(draft, coalition, pilot)
    }
  }
}

export function updateDownedPilots(draft: Campaign, coalition: Coalition) {
  const pilots = draft.coalitions[coalition].downedPilots ?? []
  if (pilots.length === 0) return

  const rescuedPilotIds = new Set<string>()
  for (const group of draft.coalitions[coalition].flightGroups) {
    if (group.task !== 'CSAR' || !group.target || !group.tot) continue
    if (draft.time < group.tot) continue

    rescuedPilotIds.add(group.target.id)
    const pilot = pilots.find((candidate) => candidate.id === group.target?.id)
    if (pilot) {
      logCampaignAction(draft, coalition, `${group.callsign} rescued ${pilot.name}`)
    }
  }

  draft.coalitions[coalition].downedPilots = pilots.filter((pilot) => {
    if (rescuedPilotIds.has(pilot.id)) return false
    return draft.time.getTime() - pilot.ejectedAt.getTime() <= config.packages.CSAR.pilotLifetimeMs
  })
}
