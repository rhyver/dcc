import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 60,
  display_name: 'B-1B',
  flare: 30,
  max_fuel: 88450,
  max_height: 18000,
  max_speed: 1530,
  name: 'B-1B',
  availableTasks: ['Pinpoint Strike', 'Strategic Strike'],
  carrierCapable: false,
  controllable: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 220.97222222222,
  era: 'Late CW',
  isHelicopter: false,
  isLarge: true,
  loadouts: [
    {
      task: 'default',
      displayName: 'default',
      name: 'default',
      pylons: [
        { CLSID: 'GBU-38*16', num: 1 },
        { CLSID: 'GBU-31*8', num: 2 },
        { CLSID: 'GBU-38*16', num: 3 }
      ]
    }
  ]
}

export default aircraftDefinition
