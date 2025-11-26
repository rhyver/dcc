import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 30,
  display_name: 'S-3B',
  flare: 30,
  max_fuel: 5500,
  max_height: 10700,
  max_speed: 840,
  name: 'S-3B',
  availableTasks: ['Ground Attack', 'Intercept'],
  controllable: false,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 82.222222222222,
  era: 'Late CW',
  carrierCapable: true,
  loadouts: [
    {
      task: 'default',
      name: 'AIM_54_Mk60*4',
      displayName: 'AIM_54_Mk60*4',
      pylons: [
        { CLSID: '{LAU-138 wtip - AIM-9M}', num: 1 },
        { CLSID: '{SHOULDER AIM-7M}', num: 2 },
        { CLSID: '{F14-300gal}', num: 3 },
        { CLSID: '{AIM_54C_Mk60}', num: 4 },
        { CLSID: '{AIM_54C_Mk60}', num: 5 },
        { CLSID: '{AIM_54C_Mk60}', num: 6 },
        { CLSID: '{AIM_54C_Mk60}', num: 7 },
        { CLSID: '{F14-300gal}', num: 8 },
        { CLSID: '{SHOULDER AIM-7M}', num: 9 },
        { CLSID: '{LAU-138 wtip - AIM-9M}', num: 10 }
      ]
    }
  ]
}

export default aircraftDefinition
