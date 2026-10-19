import { schemas } from '@dcc/contracts'
import {
  campaignHasFulcrumClient,
  factions,
  GCI_PICTURE_RADAR_TYPES,
  GCI_RADAR_LINK_METERS,
  planCampaignGciStations,
  samTemplates
} from '@dcc/data'
import * as z from 'zod'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Theatre = z.infer<typeof schemas.theatre>
type Position = z.infer<typeof schemas.position>

const IADS_EWR_TYPE = '55G6 EWR'
const IADS_EWR_COUNT = 3
const IADS_EWR_SEPARATION_METERS = 45_000
const IADS_INFRASTRUCTURE_TYPES = new Set(['Command Center', 'Power Plant', 'Logistics Hub'])
const GCI_NATO_COUNTRIES = new Set(['USA', 'UK', 'France', 'Germany', 'Israel', 'Argentina'])

function distance(a: Position, b: Position) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function ewrId(objectiveId: string, index: number) {
  const slug = objectiveId
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
  return `iads-ewr-${slug}-${index + 1}`
}

function selectEwrPositions(campaign: Campaign, theatre: Theatre) {
  const opponent = campaign.coalitions.opponent
  const samObjectiveIds = opponent.samGroups.map((sam) => sam.objectiveId)
  const infrastructureObjectiveIds = opponent.structures
    .filter((structure) => IADS_INFRASTRUCTURE_TYPES.has(structure.type))
    .map((structure) => structure.objectiveId)
  const candidateIds = [
    ...new Set([...infrastructureObjectiveIds, ...samObjectiveIds, ...opponent.objectiveIds])
  ]
  const candidates = candidateIds.flatMap((objectiveId) => {
    const position = theatre.objectives.find(
      (objective) => objective.name === objectiveId
    )?.position
    return position ? [{ objectiveId, position }] : []
  })

  const selected: typeof candidates = []
  for (const candidate of candidates) {
    if (selected.length >= IADS_EWR_COUNT) break
    if (
      selected.length === 0 ||
      selected.every(
        (entry) => distance(entry.position, candidate.position) > IADS_EWR_SEPARATION_METERS
      )
    ) {
      selected.push(candidate)
    }
  }

  return selected.length > 0 ? selected : candidates.slice(0, IADS_EWR_COUNT)
}

/**
 * Adds the generated IADS early-warning network to campaign state exactly once. An existing empty
 * array is authoritative, so destroyed/removed networks are never silently recreated.
 */
export function ensurePersistentIadsEwrs(campaign: Campaign, theatre: Theatre) {
  const opponent = campaign.coalitions.opponent
  if (opponent.ewrGroups != null) return

  if (campaign.campaignParams?.iads === false || opponent.samGroups.length === 0) {
    opponent.ewrGroups = []
    return
  }

  opponent.ewrGroups = selectEwrPositions(campaign, theatre).map(
    ({ objectiveId, position }, index) => ({
      id: ewrId(objectiveId, index),
      type: IADS_EWR_TYPE,
      objectiveId,
      position: { ...position }
    })
  )
}

/** Seed the fork's reserve dishes once per field; losses remain authoritative EWR state. */
export function ensurePersistentGciEwrs(campaign: Campaign, theatre: Theatre) {
  const planned = planCampaignGciStations(campaign, theatre)
  for (const coalition of ['player', 'opponent'] as const) {
    if (coalition === 'player' && !campaignHasFulcrumClient(campaign)) continue
    const state = campaign.coalitions[coalition]
    for (const station of planned[coalition]) {
      if (state.gciRadarSites?.includes(station.airdromeName)) continue
      state.gciRadarSites ??= []
      state.gciRadarSites.push(station.airdromeName)
      // Include historical radars: losing an existing picture must not trigger replacements.
      const hasRadar =
        (state.ewrGroups ?? []).some(
          (ewr) =>
            GCI_PICTURE_RADAR_TYPES.has(ewr.type) &&
            distance(ewr.position, station.position) <= GCI_RADAR_LINK_METERS
        ) ||
        state.samGroups.some((sam) => {
          const position = theatre.objectives.find(
            (objective) => objective.name === sam.objectiveId
          )?.position
          return (
            position != null &&
            distance(position, station.position) <= GCI_RADAR_LINK_METERS &&
            samTemplates[sam.type].units.some((type) => GCI_PICTURE_RADAR_TYPES.has(type))
          )
        }) ||
        state.groundGroups.some(
          (group) =>
            distance(group.position, station.position) <= GCI_RADAR_LINK_METERS &&
            group.units.some((unit) => GCI_PICTURE_RADAR_TYPES.has(unit.name))
        )
      if (hasRadar) continue

      const countryName =
        state.countryName ?? factions.find((faction) => faction.id === state.id)?.countryName ?? ''
      const type = GCI_NATO_COUNTRIES.has(countryName) ? 'FPS-117' : '55G6 EWR'
      state.ewrGroups ??= []
      // Stable field-based IDs survive changes to home-station channel ordering.
      const fieldId = encodeURIComponent(station.airdromeName)
      for (let index = 0; index < 3; index++) {
        const heading = (index * 2 * Math.PI) / 3
        state.ewrGroups.push({
          id: `gci-ewr-${fieldId}-${index + 1}`,
          type,
          objectiveId: station.airdromeName,
          position: {
            x: station.position.x + Math.cos(heading) * 25_000,
            y: station.position.y + Math.sin(heading) * 25_000
          }
        })
      }
    }
  }
}
