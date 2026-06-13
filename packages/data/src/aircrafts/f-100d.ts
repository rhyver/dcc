import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 0,
  display_name: 'F-100D',
  flare: 0,
  max_fuel: 3397,
  max_height: 15240,
  max_speed: 1487,
  name: 'F-100D',
  availableTasks: [
    'CAP',
    'Escort',
    'Fighter Sweep',
    'Intercept',
    'Pinpoint Strike',
    'Ground Attack',
    'Runway Attack',
    'CAS'
  ],
  carrierCapable: false,
  controllable: true,
  cruiseAltitude: 4572,
  cruiseSpeed: 236.11111111111,
  era: 'Vietnam',
  isHelicopter: false,
  loadouts: [
    {
      task: 'default',
      name: 'Default',
      displayName: 'Default',
      pylons: [
        { CLSID: '<CLEAN>', num: 1 },
        { CLSID: '<CLEAN>', num: 2 },
        { CLSID: '<CLEAN>', num: 3 },
        { CLSID: '<CLEAN>', num: 4 }
      ]
    }
  ]
}

export default aircraftDefinition
