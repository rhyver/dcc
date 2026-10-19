import { schemas } from '@dcc/contracts'
import * as z from 'zod'

// Ported from Samuelblew/DCC-Project-Germany- at 4281245.
type Campaign = z.infer<typeof schemas.campaign.campaign>
type Theatre = z.infer<typeof schemas.theatre>
type Coalition = z.infer<typeof schemas.coalition>

export const FULCRUM_AIRCRAFT_NAME = 'MiG-29 Fulcrum'
export const GCI_RANGE_METERS = 200_000
export const GCI_RADAR_LINK_METERS = 250_000
export const GCI_STATION_SPACING_METERS = 95_000
export const GCI_CHANNELS_PER_SIDE = 10
export const GCI_OPPONENT_CHANNEL_OFFSET = 10
export const GCI_AIRFIELD_STANDOFF_METERS = 400
export const GCI_STATION_TYPE = 'GCI_station_MiG29'

// P-14/P-19 can link to KRU but do not provide the usable picture needed here.
export const GCI_PICTURE_RADAR_TYPES = new Set([
  'FPS-117',
  'FPS-117 Dome',
  '55G6 EWR',
  '1L13 EWR',
  'CHAP_IRISTSLM_STR',
  'Patriot str',
  'S-300PS 40B6MD sr',
  'S-300PS 40B6MD sr_19J6',
  'S-300PS 64H6E sr',
  'SA-11 Buk SR 9S18M1',
  'RLS_19J6'
])

export type PlannedGciStation = {
  id: string
  channel: number
  coalition: Coalition
  airdromeName: string
  position: { x: number; y: number }
}
type AirdromeSite = { name: string; x: number; y: number }

export function gciStationId(coalition: Coalition, channel: number) {
  return coalition === 'player' ? `GCI-KRU-${channel}` : `GCI-KRU-OPP-${channel}`
}

export function campaignHasFulcrumClient(campaign: Campaign) {
  return campaign.coalitions.player.flightGroups.some((group) =>
    group.aircrafts.some(
      (aircraft) => aircraft.client && aircraft.aircraftName === FULCRUM_AIRCRAFT_NAME
    )
  )
}

export function isNativeGciEnabled(campaign: Campaign) {
  return campaignHasFulcrumClient(campaign) && campaign.campaignParams?.gci !== false
}

export function planCampaignGciStations(campaign: Campaign, theatre: Theatre) {
  if (!isNativeGciEnabled(campaign)) return { player: [], opponent: [] }
  const homeBase = campaign.coalitions.player.flightGroups.find((group) =>
    group.aircrafts.some(
      (aircraft) => aircraft.client && aircraft.aircraftName === FULCRUM_AIRCRAFT_NAME
    )
  )?.homeBase
  return {
    player: planGciStationsForAirdromes(theatre, campaign.coalitions.player.airdromeNames, {
      coalition: 'player',
      preferredAirdrome: homeBase
    }),
    opponent: planGciStationsForAirdromes(theatre, campaign.coalitions.opponent.airdromeNames, {
      coalition: 'opponent',
      channelOffset: GCI_OPPONENT_CHANNEL_OFFSET
    })
  }
}

export function planGciStationsForAirdromes(
  theatre: Theatre,
  airdromeNames: string[],
  options: {
    coalition: Coalition
    preferredAirdrome?: string
    channelOffset?: number
    maxStations?: number
  }
): PlannedGciStation[] {
  const names = new Set(airdromeNames)
  // Only coalition-owned airfields are eligible, including the preferred home field.

  const airdromes = [...names].flatMap((name) => {
    const airdrome = theatre.airdromeDetails[name]
    return airdrome ? [{ name: airdrome.name, x: airdrome.x, y: airdrome.y }] : []
  })
  if (airdromes.length === 0) return []

  const selected: AirdromeSite[] = []
  const uncovered = new Set(airdromes)
  const maxStations = Math.min(
    GCI_CHANNELS_PER_SIDE,
    Math.max(0, options.maxStations ?? GCI_CHANNELS_PER_SIDE)
  )
  const channelOffset = options.channelOffset ?? 0

  const pick = (site: AirdromeSite) => {
    selected.push(site)
    for (const candidate of [...uncovered]) {
      if (distance(site, candidate) <= GCI_STATION_SPACING_METERS) uncovered.delete(candidate)
    }
  }

  const home = options.preferredAirdrome
    ? airdromes.find((airdrome) => airdrome.name === options.preferredAirdrome)
    : undefined
  if (home && maxStations > 0) pick(home)

  while (uncovered.size > 0 && selected.length < maxStations) {
    let best: AirdromeSite | undefined
    let bestCount = -1
    for (const candidate of uncovered) {
      const count = countCovered(candidate, uncovered)
      if (
        count > bestCount ||
        (count === bestCount && best != null && candidate.name < best.name) ||
        (count === bestCount && best == null)
      ) {
        best = candidate
        bestCount = count
      }
    }
    if (best == null) break
    pick(best)
  }

  return selected.map((site, index) => {
    const channel = channelOffset + index + 1
    return {
      id: gciStationId(options.coalition, channel),
      channel,
      coalition: options.coalition,
      airdromeName: site.name,
      position: { x: site.x + GCI_AIRFIELD_STANDOFF_METERS, y: site.y }
    }
  })
}

function countCovered(site: AirdromeSite, uncovered: Set<AirdromeSite>) {
  let count = 0
  for (const candidate of uncovered) {
    if (distance(site, candidate) <= GCI_STATION_SPACING_METERS) count += 1
  }
  return count
}

function distance(left: { x: number; y: number }, right: { x: number; y: number }) {
  return Math.hypot(left.x - right.x, left.y - right.y)
}
