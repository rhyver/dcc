import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 30,
  display_name: 'F-5E',
  flare: 15,
  max_fuel: 2046,
  max_height: 16154,
  max_speed: 1742.4,
  name: 'F-5E-3',
  availableTasks: ['CAP', 'Escort', 'Intercept'],
  controllable: true,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 174.72222222222,
  maxWaypoints: 3,
  era: 'Early CW',
  carrierCapable: false,
  loadouts: [
    {
      task: 'default',
      name: 'AIM_54_Mk60*4',
      displayName: 'AIM_54_Mk60*4',
      pylons: [
        { CLSID: '{AIM-9B}', num: 1 },
        {
          CLSID: '<CLEAN>',
          num: 2
        },
        { CLSID: '{PTB-150GAL}', num: 3 },
        { CLSID: '{PTB-150GAL}', num: 4 },
        { CLSID: '{PTB-150GAL}', num: 5 },
        {
          CLSID: '<CLEAN>',
          num: 6
        },
        { CLSID: '{AIM-9B}', num: 7 }
      ]
    }
  ]
}

export default aircraftDefinition
