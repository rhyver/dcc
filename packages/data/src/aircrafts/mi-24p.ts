import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 0,
  display_name: 'Mi-24P Hind',
  flare: 192,

  max_fuel: 1701,
  max_speed: 330,
  name: 'Mi-24P',
  max_height: 0,
  availableTasks: ['CAS', 'CSAR', 'CASEVAC', 'Troop Extraction', 'Air Assault'],
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
        { CLSID: '{2x9M120_Ataka_V}', num: 1 },
        { CLSID: '{2x9M120_Ataka_V}', num: 2 },
        { CLSID: '{6A4B9E69-64FE-439a-9163-3A87FB6A4D81}', num: 3 },
        { CLSID: '{6A4B9E69-64FE-439a-9163-3A87FB6A4D81}', num: 4 },
        { CLSID: '{2x9M120_Ataka_V}', num: 5 },
        { CLSID: '{2x9M120_Ataka_V}', num: 6 }
      ]
    }
  ]
}

export default aircraftDefinition
