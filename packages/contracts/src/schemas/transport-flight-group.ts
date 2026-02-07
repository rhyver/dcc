import { z } from 'zod'
import { flightGroup } from './flight-group'

export const cargoStatus = z.enum(['loaded', 'in-transit', 'delivered', 'lost'])

export const transportFlightGroup = flightGroup.extend({
  cargoAmount: z.number().min(0),           // Supply points being carried
  sourceNode: z.string(),                    // Origin objective/airdrome ID
  destinationNode: z.string(),               // Destination ID
  cargoStatus: cargoStatus,
  transportType: z.enum(['strategic', 'tactical', 'emergency'])
})

export type TransportFlightGroup = z.infer<typeof transportFlightGroup>
export type CargoStatus = z.infer<typeof cargoStatus>
