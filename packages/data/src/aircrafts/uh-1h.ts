import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 0,
  display_name: 'UH-1H',
  flare: 60,
  max_fuel: 631,
  max_height: 5000,
  max_speed: 200,
  name: 'UH-1H',
  availableTasks: [
    'CSAR',
    'CASEVAC',
    'Troop Extraction',
    'Ground Attack',
    'Transport',
    'Air Assault'
  ],
  controllable: true,
  isHelicopter: true,
  cruiseAltitude: 150,
  cruiseSpeed: 46.25,
  era: 'Korea',
  carrierCapable: true,
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'default',
      pylons: [
        { CLSID: 'M134_L', num: 1 },
        { CLSID: 'XM158_MK5', num: 2 },
        { CLSID: '<CLEAN>', num: 2 },
        { CLSID: '<CLEAN>', num: 3 },
        { CLSID: 'XM158_MK5', num: 5 },
        { CLSID: 'M134_R', num: 6 }
      ]
    }
  ]
}

export default aircraftDefinition
