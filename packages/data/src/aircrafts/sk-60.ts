import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 120,
  display_name: 'SK-60',
  flare: 120,
  max_fuel: 3181,
  max_height: 11500,
  max_speed: 763,
  name: 'SK-60',
  availableTasks: ['CAS', 'Ground Attack', 'Pinpoint Strike'],
  carrierCapable: false,
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 200,
  era: 'Vietnam',
  isHelicopter: false,
  isMod: true,
  allowedFrequency: [100, 156],
  loadouts: [
    {
      displayName: 'Default',
      name: 'default',
      task: 'default',
      pylons: [
        {
          CLSID: '{d694b359-e7a8-4909-88d4-7100b77afd12}',
          num: 1
        },
        {
          CLSID: '{d694b359-e7a8-4909-88d4-7100b77afd12}',
          num: 2
        },
        {
          CLSID: '{d694b359-e7a8-4909-88d4-7100b77afd11}',
          num: 3
        },
        {
          CLSID: '{d694b359-e7a8-4909-88d4-7100b77afd11}',
          num: 4
        },
        {
          CLSID: '{d694b359-e7a8-4909-88d4-7100b77afd12}',
          num: 5
        },
        {
          CLSID: '{d694b359-e7a8-4909-88d4-7100b77afd12}',
          num: 6
        }
      ]
    }
  ]
}

export default aircraftDefinition
