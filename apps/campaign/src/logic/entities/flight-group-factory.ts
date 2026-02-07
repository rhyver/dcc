import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { FlightGroup } from './flight-group'
import { SeadFlightGroup } from './sead-flight-group'
import { StrikeFlightGroup } from './strike-flight-group'
import { DeadFlightGroup } from './dead-flight-group'
import { CapFlightGroup } from './cap-flight-group'
import { TransportFlightGroup } from './transport-flight-group'

export const FlightGroupFactory = {
  getCoalitionFlightGroups(
    draft: z.infer<typeof schemas.campaign.campaign>,
    coalition: z.infer<typeof schemas.coalition>
  ): FlightGroup[] {
    return draft.coalitions[coalition].flightGroups.map((data) => {
      if (data.task === 'Pinpoint Strike') {
        return new StrikeFlightGroup(data)
      }
      if (data.task === 'SEAD') {
        return new SeadFlightGroup(data)
      }
      if (data.task === 'DEAD') {
        return new DeadFlightGroup(data)
      }
      if (data.task === 'CAP') {
        return new CapFlightGroup(data)
      }
      if (data.task === 'Transport') {
        return new TransportFlightGroup(data)
      }
      return new FlightGroup(data)
    })
  }
}
