import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { FlightGroup } from '../entities/flight-group'

export function updateFlightGroups(
  draft: z.infer<typeof schemas.campaign.campaign>,
  coalition: z.infer<typeof schemas.coalition>
) {
  const groups = FlightGroup.getCoalitionFlightGroups(draft, coalition)
  for (const group of groups) {
    group.move(draft.time)
  }
}
