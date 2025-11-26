import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 0,
  display_name: 'Ka-50 III',
  flare: 128,
  max_fuel: 1450,
  max_speed: 350,
  name: 'Ka-50_3',
  max_height: 0,
  availableTasks: ['CAS'],
  controllable: true,
  cruiseAltitude: 1000,
  cruiseSpeed: 46.25,
  isHelicopter: true,
  era: 'Modern',
  carrierCapable: false,
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'default',
      pylons: [
        { CLSID: '{A6FD14D3-6D30-4C85-88A7-8D17BEE120E2}', num: 1 },
        { CLSID: 'B_8V20A_OFP2', num: 2 },
        { CLSID: 'B_8V20A_OFP2', num: 3 },
        { CLSID: '{A6FD14D3-6D30-4C85-88A7-8D17BEE120E2}', num: 4 },
        { CLSID: '{9S846_2xIGLA}', num: 5 },
        { CLSID: '{9S846_2xIGLA}', num: 6 }
      ]
    }
  ]
}

export default aircraftDefinition
