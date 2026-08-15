import { schemas } from '@dcc/contracts'
import * as z from 'zod'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Theatre = z.infer<typeof schemas.theatre>
type Position = z.infer<typeof schemas.position>

const IADS_EWR_TYPE = '55G6 EWR'
const IADS_EWR_COUNT = 3
const IADS_EWR_SEPARATION_METERS = 45_000
const IADS_INFRASTRUCTURE_TYPES = new Set(['Command Center', 'Power Plant', 'Logistics Hub'])

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
