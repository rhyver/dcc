import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 60,
  display_name: 'MiG-23MLD',
  flare: 60,
  max_fuel: 3800,
  max_height: 18600,
  max_speed: 2500,
  name: 'MiG-23MLD',
  availableTasks: ['CAP', 'Escort', 'Intercept'],
  controllable: false,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 220.97222222222,
  era: 'Vietnam',
  carrierCapable: false,
  loadouts: [
    {
      task: 'default',
      name: 'Patrol, medium range',
      displayName: 'Patrol, medium range',
      pylons: [
        {
          CLSID: '<CLEAN>',
          num: 1
        },
        { CLSID: '{CCF898C9-5BC7-49A4-9D1E-C3ED3D5166A1}', num: 2 },
        { CLSID: '{B0DBC591-0F52-4F7D-AD7B-51E67725FB81}', num: 3 },
        { CLSID: '{A5BAEAB7-6FAF-4236-AF72-0FD900F493F9}', num: 4 },
        { CLSID: '{275A2855-4A79-4B2D-B082-91EA2ADF4691}', num: 5 },
        { CLSID: '{CCF898C9-5BC7-49A4-9D1E-C3ED3D5166A1}', num: 6 }
      ]
    }
  ]
}

export default aircraftDefinition
