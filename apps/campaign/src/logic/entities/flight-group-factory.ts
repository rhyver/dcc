import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { FlightGroup } from './flight-group'
import { StrikeFlightGroup } from './strike-flight-group'

export const FlightGroupFactory = {
  getCoalitionFlightGroups(
    draft: z.infer<typeof schemas.campaign.campaign>,
    coalition: z.infer<typeof schemas.coalition>
  ): FlightGroup[] {
    return draft.coalitions[coalition].flightGroups.map((data) => {
      if (data.task === 'Pinpoint Strike') {
        return new StrikeFlightGroup(data)
      }
      return new FlightGroup(data)
    })
  }
}
