import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const airport: z.infer<typeof schemas.dcs.warehouseState> = {
  allowHotStart: false,
  unlimitedMunitions: true,
  methanol_mixture: {
    InitFuel: 100
  },
  OperatingLevel_Air: 10,
  diesel: {
    InitFuel: 100
  },
  speed: 16.666666,
  dynamicSpawn: false,
  unlimitedAircrafts: true,
  unlimitedFuel: true,
  jet_fuel: {
    InitFuel: 100
  },
  periodicity: 30,
  suppliers: [],
  coalition: 'NEUTRAL',
  dynamicCargo: false,
  OperatingLevel_Eqp: 10,
  gasoline: {
    InitFuel: 100
  },
  aircrafts: {},
  weapons: {},
  OperatingLevel_Fuel: 10,
  size: 100
}

export function warehouses(
  theatre: z.infer<typeof schemas.theatre>,
  campaign: z.infer<typeof schemas.campaign.campaign>
): z.infer<typeof schemas.dcs.warehouses> {
  const warehouses: z.infer<typeof schemas.dcs.warehouses> = {
    airports: {},
    warehouses: {}
  }

  for (const airdrome of Object.values(theatre.airdromeDetails)) {
    const id = airdrome.id.toString()
    const isBlue = campaign.coalitions.player.airdromeNames.includes(airdrome.name)
    const isRed = campaign.coalitions.opponent.airdromeNames.includes(airdrome.name)
    const coalition = isBlue ? 'BLUE' : isRed ? 'RED' : 'NEUTRAL'
    warehouses.airports[id] = { ...airport, coalition }
  }

  return warehouses
}
