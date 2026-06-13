import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 0,
  display_name: 'L-39ZA',
  flare: 0,
  max_fuel: 980,
  max_height: 11000,
  max_speed: 763.2,
  name: 'L-39ZA',
  availableTasks: ['CAS', 'Ground Attack'],
  controllable: true,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 133.61111111111,
  era: 'Vietnam',
  carrierCapable: false,
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'default',
      pylons: [
        { CLSID: '{UB-16-57UMP}', num: 1 },
        { CLSID: '{FAB-100x2}', num: 2 },
        { CLSID: '<CLEAN>', num: 3 },
        { CLSID: '{FAB-100x2}', num: 4 },
        { CLSID: '{UB-16-57UMP}', num: 5 }
      ]
    }
  ]
}

export default aircraftDefinition
