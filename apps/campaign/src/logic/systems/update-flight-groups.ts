import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { FlightGroup } from '../entities/flight-group'

export function updateFlightGroups(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  const groups = FlightGroup.getCoalitionFlightGroups(draft, coalition)
  const finishedIds = new Set<string>()

  for (const group of groups) {
    group.move(draft.time)
    if (group.isLanded(draft.time)) {
      finishedIds.add(group.id)
    }

    group.processTarget(draft, coalition)
  }

  if (finishedIds.size > 0) {
    draft.coalitions[coalition].flightGroups = draft.coalitions[coalition].flightGroups.filter(
      (g) => !finishedIds.has(g.id)
    )
  }
}
