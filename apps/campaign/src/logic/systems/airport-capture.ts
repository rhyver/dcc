import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { calculateDistance } from '@/logic/utils/calculate-distance'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type Position = z.infer<typeof schemas.position>
type Theatre = z.infer<typeof schemas.theatre>
type Supply = z.infer<typeof schemas.supply>

export const AIRPORT_OBJECTIVE_INFLUENCE_RADIUS = 40_000

export function getAirdromePosition(
  theatre: Theatre,
  airdromeName: string
): Position | undefined {
  const airdrome = theatre.airdromeDetails[airdromeName]
  if (!airdrome) return undefined
  return { x: airdrome.x, y: airdrome.y }
}

export function getNearbyObjectiveIds(theatre: Theatre, airdromeName: string): string[] {
  const airdromePosition = getAirdromePosition(theatre, airdromeName)
  if (!airdromePosition) return []

  return theatre.objectives
    .filter(
      (objective) =>
        objective.name !== airdromeName &&
        calculateDistance(airdromePosition, objective.position) <=
          AIRPORT_OBJECTIVE_INFLUENCE_RADIUS
    )
    .map((objective) => objective.name)
}

export function isAirdromeVulnerable(
  draft: Campaign,
  theatre: Theatre,
  attackerCoalition: Coalition,
  airdromeName: string
): boolean {
  const nearbyObjectiveIds = getNearbyObjectiveIds(theatre, airdromeName)
  if (nearbyObjectiveIds.length === 0) return true

  const attackerObjectiveIds = new Set(draft.coalitions[attackerCoalition].objectiveIds)
  const attackerControlledCount = nearbyObjectiveIds.filter((objectiveId) =>
    attackerObjectiveIds.has(objectiveId)
  ).length

  return attackerControlledCount > nearbyObjectiveIds.length / 2
}

export function transferAirdromeOwnership(
  draft: Campaign,
  attackerCoalition: Coalition,
  defenderCoalition: Coalition,
  airdromeName: string
): void {
  const defenderAirdromes = draft.coalitions[defenderCoalition].airdromeNames
  const defenderAirdromeIndex = defenderAirdromes.indexOf(airdromeName)
  if (defenderAirdromeIndex !== -1) {
    defenderAirdromes.splice(defenderAirdromeIndex, 1)
  }

  const attackerAirdromes = draft.coalitions[attackerCoalition].airdromeNames
  if (!attackerAirdromes.includes(airdromeName)) {
    attackerAirdromes.push(airdromeName)
  }

  transferAirdromeSupplyNode(draft, attackerCoalition, defenderCoalition, airdromeName)
}

function transferAirdromeSupplyNode(
  draft: Campaign,
  attackerCoalition: Coalition,
  defenderCoalition: Coalition,
  airdromeName: string
): void {
  const attackerSupplyNodes = (draft.coalitions[attackerCoalition].supplyNodes ??= {})
  const defenderSupplyNodes = draft.coalitions[defenderCoalition].supplyNodes
  const defenderSupply = defenderSupplyNodes?.[airdromeName]

  if (defenderSupplyNodes && defenderSupply) {
    delete defenderSupplyNodes[airdromeName]
  }

  attackerSupplyNodes[airdromeName] = normalizeCapturedAirdromeSupply(defenderSupply)
}

function normalizeCapturedAirdromeSupply(previousSupply: Supply | undefined): Supply {
  const max = previousSupply?.max ?? 10_000
  const current = Math.min(previousSupply?.current ?? 2_500, max)

  return {
    current,
    max,
    productionRate: 0,
    consumptionRate: 0,
    status: getSupplyStatus(current, max)
  }
}

function getSupplyStatus(current: number, max: number): Supply['status'] {
  const percentage = max > 0 ? current / max : 0
  if (percentage > 0.75) return 'abundant'
  if (percentage > 0.5) return 'adequate'
  if (percentage > 0.25) return 'low'
  if (percentage > 0.05) return 'critical'
  return 'depleted'
}
