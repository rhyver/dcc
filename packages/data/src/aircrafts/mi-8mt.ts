import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 0,
  display_name: 'Mi-8 Hip',
  flare: 128,

  max_fuel: 1929,
  max_height: 5000,
  max_speed: 250,
  name: 'Mi-8MT',
  availableTasks: ['CSAR', 'Transport', 'Air Assault'],
  controllable: true,
  cruiseAltitude: 1000,
  cruiseSpeed: 46.25,
  isHelicopter: true,
  era: 'Vietnam',
  carrierCapable: false,
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'default',
      pylons: [
        { CLSID: '<CLEAN>', num: 1 },
        { CLSID: '<CLEAN>', num: 2 },
        { CLSID: '<CLEAN>', num: 3 },
        { CLSID: '<CLEAN>', num: 4 },
        { CLSID: '<CLEAN>', num: 5 },
        { CLSID: '<CLEAN>', num: 6 },
        {
          CLSID: 'KORD_12_7',
          num: 7
        },
        {
          CLSID: 'PKT_7_62',
          num: 8
        }
      ]
    },
    {
      task: 'CSAR',
      name: 'CSAR',
      displayName: 'CSAR',
      pylons: [
        { CLSID: '<CLEAN>', num: 1 },
        { CLSID: '<CLEAN>', num: 2 },
        { CLSID: '<CLEAN>', num: 3 },
        { CLSID: '<CLEAN>', num: 4 },
        { CLSID: '<CLEAN>', num: 5 },
        { CLSID: '<CLEAN>', num: 6 },
        {
          CLSID: 'KORD_12_7',
          num: 7
        },
        {
          CLSID: 'PKT_7_62',
          num: 8
        }
      ]
    }
  ]
}

export default aircraftDefinition
