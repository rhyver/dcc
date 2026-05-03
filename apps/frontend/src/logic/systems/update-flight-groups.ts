import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { scenarios, theatres } from '@dcc/data'
import { isStrikeFlightGroup } from '../entities/strike-flight-group'
import { isSeadFlightGroup } from '../entities/sead-flight-group'
import { isDeadFlightGroup } from '../entities/dead-flight-group'
import { isCapFlightGroup } from '../entities/cap-flight-group'
import { FlightGroupFactory } from '../entities/flight-group-factory'
import { logCombatAction } from '../simulation-log'
import { debugLog } from '@/lib/debug'

export function updateFlightGroups(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  const groups = FlightGroupFactory.getCoalitionFlightGroups(draft, coalition)
  const finishedIds = new Set<string>()

  // Get theatre for SEAD operations
  const scenario = scenarios.find((s) => s.id === draft.scenarioId)
  const theatre = scenario ? theatres.find((t) => t.name === scenario.theatreName) : undefined

  debugLog('Updating flight groups', groups.length)

  for (const group of groups) {
    if (group.aircrafts.length === 0) {
      finishedIds.add(group.id)
      continue
    }

    group.move(draft.time)
    if (group.isLanded(draft.time)) {
      finishedIds.add(group.id)
      if (
        group.task === 'CAP' ||
        group.task === 'SEAD' ||
        group.task === 'DEAD' ||
        group.task === 'Pinpoint Strike'
      ) {
        logCombatAction(draft, coalition, `${group.task} landed`, group.callsign, {
          entityType: 'flightGroup',
          entityId: group.id
        })
      }
    }

    if (isStrikeFlightGroup(group)) {
      debugLog('Striking structure', group)
      group.strikeStructure(draft, coalition)
    } else if (isSeadFlightGroup(group) && theatre) {
      debugLog('SEAD suppressing SAM', group)
      group.suppressSam(draft, coalition, theatre)
    } else if (isDeadFlightGroup(group) && theatre) {
      debugLog('DEAD attacking SAM', group)
      group.destroySam(draft, coalition, theatre)
    } else if (isCapFlightGroup(group)) {
      debugLog('CAP patrolling', group)
      group.engageAirTargets(draft, coalition)
    } else {
      debugLog('Not a strike/SEAD/DEAD/CAP group', group.task)
    }
  }

  // Clear suppression for SAMs targeted by finished SEAD flights
  if (finishedIds.size > 0) {
    const enemyCoalition = coalition === 'player' ? 'opponent' : 'player'
    const finishedSeadGroups = groups.filter((g) => finishedIds.has(g.id) && isSeadFlightGroup(g))

    for (const seadGroup of finishedSeadGroups) {
      if (seadGroup.target) {
        const samGroup = draft.coalitions[enemyCoalition].samGroups.find(
          (s) => s.id === seadGroup.target?.id
        )
        if (samGroup) {
          samGroup.suppressed = false
          debugLog(`SAM ${samGroup.type} no longer suppressed - SEAD landed`)
          logCombatAction(
            draft,
            coalition,
            `SEAD completed, suppression lifted on ${samGroup.type} at ${samGroup.objectiveId}`,
            seadGroup.callsign,
            {
              entityType: 'flightGroup',
              entityId: seadGroup.id
            }
          )
        }
      }
    }

    draft.coalitions[coalition].flightGroups = draft.coalitions[coalition].flightGroups.filter(
      (g) => !finishedIds.has(g.id)
    )
  }
}
