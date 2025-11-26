import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 30,
  display_name: 'A-4E-C',
  flare: 30,
  max_fuel: 2221,
  max_height: 13380.72,
  max_speed: 1082.88,
  name: 'A-4E-C',
  availableTasks: ['CAS', 'Ground Attack', 'Pinpoint Strike', 'CAP', 'DEAD', 'Intercept'],
  carrierCapable: true,
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 174.72222222222,
  era: 'Early CW',
  isHelicopter: false,
  isMod: true,
  loadouts: [
    {
      task: 'Pinpoint Strike',
      name: 'Strike',
      displayName: 'Strike',
      pylons: [
        {
          CLSID: '<CLEAN>',
          num: 1
        },
        {
          CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}',
          num: 2
        },
        {
          CLSID: '{Mk-82_MER_4_C}',
          num: 3
        },
        {
          CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}',
          num: 4
        },
        {
          CLSID: '<CLEAN>',
          num: 5
        }
      ]
    },
    {
      task: 'DEAD',
      name: 'DEAD',
      displayName: 'DEAD',
      pylons: [
        {
          CLSID: '{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}',
          num: 1
        },
        {
          CLSID: '{AGM_45A}',
          num: 2
        },
        {
          CLSID: '{DFT-300gal}',
          num: 3
        },
        {
          CLSID: '{AGM_45A}',
          num: 4
        },
        {
          CLSID: '{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}',
          num: 5
        }
      ]
    },
    {
      task: 'CAS',
      name: 'CAS',
      displayName: 'CAS',
      pylons: [
        {
          CLSID: '{LAU3_FFAR_MK1HE}',
          num: 1
        },
        {
          CLSID: '{LAU-3 FFAR Mk5 HEAT_TER_2_L}',
          num: 2
        },
        {
          CLSID: '{DFT-300gal}',
          num: 3
        },
        {
          CLSID: '{LAU-3 FFAR Mk5 HEAT_TER_2_R}',
          num: 4
        },
        {
          CLSID: '{LAU3_FFAR_MK1HE}',
          num: 5
        }
      ]
    },
    {
      task: 'default',
      name: 'default',
      displayName: 'default',
      pylons: [
        {
          CLSID: '{AIM-9P5-ON-ADAPTER}',
          num: 1
        },
        {
          CLSID: '{AIM-9P5-ON-ADAPTER}',
          num: 2
        },
        {
          CLSID: '{DFT-150gal}',
          num: 3
        },
        {
          CLSID: '{AIM-9P5-ON-ADAPTER}',
          num: 4
        },
        {
          CLSID: '{AIM-9P5-ON-ADAPTER}',
          num: 5
        }
      ]
    }
  ]
}

export default aircraftDefinition
