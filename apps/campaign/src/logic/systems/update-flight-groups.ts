import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { FlightGroup } from '../entities/flight-group'
import { isStrikeFlightGroup } from '../entities/strike-flight-group'

export function updateFlightGroups(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  const groups = FlightGroup.getCoalitionFlightGroups(draft, coalition)
  const finishedIds = new Set<string>()

  console.log('Updating flight groups', groups.length)

  for (const group of groups) {
    group.move(draft.time)
    if (group.isLanded(draft.time)) {
      finishedIds.add(group.id)
    }

    if (isStrikeFlightGroup(group)) {
      console.log('Striking structure', group)
      group.strikeStructure(draft, coalition)
    } else {
      console.log('Not a strike group', group.task)
    }
  }

  if (finishedIds.size > 0) {
    draft.coalitions[coalition].flightGroups = draft.coalitions[coalition].flightGroups.filter(
      (g) => !finishedIds.has(g.id)
    )
  }
}
