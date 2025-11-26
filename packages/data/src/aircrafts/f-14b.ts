import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 140,
  display_name: 'F-14B',
  flare: 60,
  max_fuel: 7348,
  max_height: 17000,
  max_speed: 2520,
  name: 'F-14B',
  availableTasks: ['CAP', 'Escort', 'Ground Attack', 'Intercept', 'Pinpoint Strike', 'CAS'],
  controllable: true,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 220.97222222222,
  maxWaypoints: 3,
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
    },
    {
      task: 'CAS',
      name: 'CAS',
      displayName: 'CAS',
      pylons: [
        {
          CLSID: '{LAU-138 wtip - AIM-9M}',
          num: 1
        },
        {
          CLSID: '{SHOULDER AIM-7M}',
          num: 2
        },
        {
          CLSID: '{F14-300gal}',
          num: 3
        },
        {
          CLSID: '{BRU-32 GBU-12}',
          num: 4
        },
        {
          CLSID: '{BRU-32 GBU-12}',
          num: 5
        },
        {
          CLSID: '{BRU-32 GBU-12}',
          num: 6
        },
        {
          CLSID: '{BRU-32 GBU-12}',
          num: 7
        },
        {
          CLSID: '{F14-300gal}',
          num: 8
        },
        {
          CLSID: '{F14-LANTIRN-TP}',
          num: 9
        },
        {
          CLSID: '{LAU-138 wtip - AIM-9M}',
          num: 10
        }
      ]
    },
    {
      task: 'Pinpoint Strike',
      name: 'Strike',
      displayName: 'Strike',
      pylons: [
        {
          CLSID: '{LAU-138 wtip - AIM-9M}',
          num: 1
        },
        {
          CLSID: '{SHOULDER AIM-7M}',
          num: 2
        },
        {
          CLSID: '{F14-300gal}',
          num: 3
        },
        {
          CLSID: '{BRU-32 GBU-12}',
          num: 4
        },
        {
          CLSID: '{BRU-32 GBU-12}',
          num: 5
        },
        {
          CLSID: '{BRU-32 GBU-12}',
          num: 6
        },
        {
          CLSID: '{BRU-32 GBU-12}',
          num: 7
        },
        {
          CLSID: '{F14-300gal}',
          num: 8
        },
        {
          CLSID: '{F14-LANTIRN-TP}',
          num: 9
        },
        {
          CLSID: '{LAU-138 wtip - AIM-9M}',
          num: 10
        }
      ]
    }
  ]
}

export default aircraftDefinition
