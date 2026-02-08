import { schemas } from '@dcc/contracts'
import { scenarios, theatres } from '@dcc/data'
import * as z from 'zod'
import { calculateDistance } from '@/logic/utils/calculate-distance'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>

const INFANTRY_SPEED = 4 // m/s (~14 km/h)
const VEHICLE_SPEED = 12 // m/s (~43 km/h)
const CAPTURE_DISTANCE = 2000 // meters

function isInfantryGroup(units: { name: string; count: number }[]): boolean {
  return units.every((u) => /infantry|soldier/i.test(u.name))
}

type UpdateGroundGroupsOptions = {
  capture?: boolean
}

export function updateGroundGroups(
  draft: Campaign,
  coalition: Coalition,
  delta: number,
  options: UpdateGroundGroupsOptions = {}
): void {
  const scenario = scenarios.find((s) => s.id === draft.scenarioId)
  if (!scenario) return

  const theatre = theatres.find((t) => t.name === scenario.theatreName)
  if (!theatre) return

  const captureEnabled = options.capture ?? true
  const enemyCoalition: Coalition = coalition === 'player' ? 'opponent' : 'player'
  const groundGroups = draft.coalitions[coalition].groundGroups

  for (let i = groundGroups.length - 1; i >= 0; i--) {
    const gg = groundGroups[i]!
    if (gg.state === 'idle' || !gg.targetObjectiveId) continue

    const targetObjective = theatre.objectives.find((o) => o.name === gg.targetObjectiveId)
    if (!targetObjective) continue

    // Check if target is still enemy-owned
    const enemyObjectiveIds = draft.coalitions[enemyCoalition].objectiveIds
    if (!enemyObjectiveIds.includes(gg.targetObjectiveId)) {
      // Target no longer enemy-owned, stop moving
      gg.state = 'idle'
      gg.targetObjectiveId = undefined
      continue
    }

    const distance = calculateDistance(gg.position, targetObjective.position)

    // Capture logic
    if (captureEnabled && distance <= CAPTURE_DISTANCE) {
      const targetId = gg.targetObjectiveId

      // Transfer objective ownership
      const enemyIdx = enemyObjectiveIds.indexOf(targetId)
      if (enemyIdx !== -1) {
        enemyObjectiveIds.splice(enemyIdx, 1)
      }
      draft.coalitions[coalition].objectiveIds.push(targetId)

      // Remove enemy structures at this objective
      draft.coalitions[enemyCoalition].structures = draft.coalitions[
        enemyCoalition
      ].structures.filter((s) => s.objectiveId !== targetId)

      // Remove enemy SAM groups at this objective
      draft.coalitions[enemyCoalition].samGroups = draft.coalitions[
        enemyCoalition
      ].samGroups.filter((s) => s.objectiveId !== targetId)

      // Remove enemy idle ground groups defending this objective
      draft.coalitions[enemyCoalition].groundGroups = draft.coalitions[
        enemyCoalition
      ].groundGroups.filter((g) => !(g.objectiveId === targetId && g.state === 'idle'))

      // Remove the attacking group (becomes garrison conceptually)
      groundGroups.splice(i, 1)
      continue
    }

    // Movement logic
    const campaignDeltaS = (delta * draft.timeMultiplier) / 1000
    const speed = isInfantryGroup(gg.units) ? INFANTRY_SPEED : VEHICLE_SPEED
    const ratio = Math.min((speed * campaignDeltaS) / distance, 1)

    const dx = targetObjective.position.x - gg.position.x
    const dy = targetObjective.position.y - gg.position.y
    gg.position.x += dx * ratio
    gg.position.y += dy * ratio
  }
}
