import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 120,
  display_name: 'F-4E',
  flare: 30,
  max_fuel: 5510.5,
  max_height: 19000,
  max_speed: 2370,
  name: 'F-4E-45MC',
  availableTasks: [
    'CAS',
    'CAP',
    'Escort',
    'Intercept',
    'Fighter Sweep',
    'Ground Attack',
    'Pinpoint Strike',
    'SEAD',
    'DEAD'
  ],
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 251.80555555556,
  isHelicopter: false,
  era: 'Early CW',
  carrierCapable: false,
  isMod: false,
  AddPropAircraft: {
    LaserCodeDigit1: 1,
    TacanBand: 0,
    Quality: 100,
    ChaffDoubleDispense: false,
    LaserCodeDigit4: 8,
    IffMode2Digit4: 0,
    IffMode2Digit2: 0,
    IsNvgAllowed: true,
    LaserCodeDigit2: 6,
    KY28Key: 1,
    LaserCodeDigit3: 8,
    IffMode2Digit1: 0,
    VORILSFrequencyDecimalMHZ: 0,
    UseReferenceAircraft: false,
    IffMode2Digit3: 0,
    Wear: 0,
    VORILSFrequencyMHZ: 108,
    TacanChannel: 0,
    INSAlignmentStored: true
  },
  loadouts: [
    {
      task: 'default',
      name: 'Default',
      displayName: 'Default',
      pylons: [
        {
          CLSID: '{F4_SARGENT_TANK_370_GAL}'
        },
        {
          CLSID: '{AIM-9J}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{AIM-9J}'
        },
        {
          CLSID: '{HB_F4E_AIM-7E}'
        },
        {
          CLSID: '{HB_F4E_AIM-7E}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_AIM-7E}'
        },
        {
          CLSID: '{HB_F4E_AIM-7E}'
        },
        {
          CLSID: '{AIM-9J}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{AIM-9J}'
        },
        {
          CLSID: '{F4_SARGENT_TANK_370_GAL_R}'
        },
        {
          CLSID: '{HB_ALE_40_30_60}'
        }
      ]
    },
    {
      task: 'CAS',
      name: 'CAS',
      displayName: 'CAS',
      pylons: [
        {
          CLSID: '{HB_F4E_CBU-52B_MER_3x_Left}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_CBU-52B_2x}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_AIM-7E-2}'
        },
        {
          CLSID: '{HB_F4E_AIM-7E-2}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_AIM-7E-2}'
        },
        {
          CLSID: '{HB_F4E_AIM-7E-2}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_CBU-52B_2x}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_CBU-52B_MER_3x_Right}'
        },
        {
          CLSID: '{HB_ALE_40_30_60}'
        }
      ]
    },
    {
      task: 'Pinpoint Strike',
      name: 'Strike',
      displayName: 'Strike',
      pylons: [
        {
          CLSID: '{HB_F4E_MK-83_MER_2x}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_MK-83_3x}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_AIM-7E-2}'
        },
        {
          CLSID: '{HB_ALQ-131_ON_ADAPTER_IN_AERO7}'
        },
        {
          CLSID: '{HB_F4E_MK-83_MER_3x_Ripple}'
        },
        {
          CLSID: '{HB_F4E_AIM-7E-2}'
        },
        {
          CLSID: '{HB_F4E_AIM-7E-2}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_MK-83_3x}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_MK-83_MER_2x}'
        },
        {
          CLSID: '{HB_ALE_40_30_60}'
        }
      ]
    },
    {
      task: 'DEAD',
      name: 'DEAD',
      displayName: 'DEAD',
      pylons: [
        {
          CLSID: '{HB_F4E_CBU-52B_MER_3x_Left}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_CBU-52B_2x}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_AIM-7E-2}'
        },
        {
          CLSID: '{HB_F4E_AIM-7E-2}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_AIM-7E-2}'
        },
        {
          CLSID: '{HB_F4E_AIM-7E-2}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_CBU-52B_2x}'
        },
        {
          CLSID: '<CLEAN>'
        },
        {
          CLSID: '{HB_F4E_CBU-52B_MER_3x_Right}'
        },
        {
          CLSID: '{HB_ALE_40_30_60}'
        }
      ]
    },
    {
      task: 'SEAD',
      name: 'SEAD',
      displayName: 'SEAD',
      pylons: [
        {
          CLSID: '{LAU_34_AGM_45A}'
        },
        {
          CLSID: '{AIM-9L}'
        },
        {
          CLSID: '{HB_F4E_AGM-65A_LAU117_SWA}'
        },
        {
          CLSID: '{AIM-9L}'
        },
        {
          CLSID: '{HB_F4E_AIM-7F}'
        },
        {
          CLSID: '{HB_ALQ-131_ON_ADAPTER_IN_AERO7}'
        },
        {
          CLSID: '{F4_SARGENT_TANK_600_GAL}'
        },
        {
          CLSID: '{HB_F4E_AIM-7F}'
        },
        {
          CLSID: '{HB_F4E_AIM-7F}'
        },
        {
          CLSID: '{AIM-9L}'
        },
        {
          CLSID: '{HB_F4E_AGM-65A_LAU117_SWA}'
        },
        {
          CLSID: '{AIM-9L}'
        },
        {
          CLSID: '{LAU_34_AGM_45A}'
        },
        {
          CLSID: '{HB_ALE_40_30_60}'
        }
      ]
    }
  ]
}

export default aircraftDefinition
