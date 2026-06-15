import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 72,
  display_name: 'Tu-160',
  flare: 72,
  max_fuel: 157000,
  max_height: 15600,
  max_speed: 2200,
  name: 'Tu-160',
  availableTasks: ['Pinpoint Strike', 'Strategic Strike'],
  controllable: false,
  isHelicopter: false,
  isLarge: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 220.97222222222,
  era: 'Modern',
  carrierCapable: false,
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'default',
      pylons: [
        { CLSID: '{0290F5DE-014A-4BB1-9843-D717749B1DED}', num: 1 },
        { CLSID: '{0290F5DE-014A-4BB1-9843-D717749B1DED}', num: 2 }
      ]
    }
  ]
}

export default aircraftDefinition
