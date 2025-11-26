import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 96,
  display_name: 'J-11A',
  flare: 96,
  max_fuel: 9400,
  max_height: 18500,
  max_speed: 2499.984,
  name: 'J-11A',
  availableTasks: ['CAP', 'CAS', 'Pinpoint Strike', 'Escort', 'Intercept'],
  carrierCapable: false,
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 220.97222222222,
  era: 'Modern',
  isHelicopter: false,
  loadouts: [
    {
      task: 'CAS',
      name: 'CAS',
      displayName: 'CAS',
      pylons: [
        {
          CLSID: '{RKL609_L}'
        },
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}'
        },
        {
          CLSID: '{B8M1_20_S8KOM_DUAL_L}'
        },
        {
          CLSID: '{7AEC222D-C523-425e-B714-719C0D1EB14D}'
        },
        {
          CLSID: '{D5435F26-F120-4FA3-9867-34ACE562EF1B}'
        },
        {
          CLSID: '{D5435F26-F120-4FA3-9867-34ACE562EF1B}'
        },
        {
          CLSID: '{7AEC222D-C523-425e-B714-719C0D1EB14D}'
        },
        {
          CLSID: '{B8M1_20_S8KOM_DUAL_R}'
        },
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}'
        },
        {
          CLSID: '{RKL609_R}'
        }
      ]
    },
    {
      task: 'Pinpoint Strike',
      name: 'Strike',
      displayName: 'Strike',
      pylons: [
        {
          CLSID: '{RKL609_L}'
        },
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}'
        },
        {
          CLSID: '{FAB_250_DUAL_L}'
        },
        {
          CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}'
        },
        {
          CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}'
        },
        {
          CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}'
        },
        {
          CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}'
        },
        {
          CLSID: '{FAB_250_DUAL_R}'
        },
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}'
        },
        {
          CLSID: '{RKL609_R}'
        }
      ]
    },
    {
      task: 'default',
      name: 'Default',
      displayName: 'Default',
      pylons: [
        {
          CLSID: '{RKL609_L}'
        },
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}'
        },
        {
          CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}'
        },
        {
          CLSID: '{B4C01D60-A8A3-4237-BD72-CA7655BC0FE9}'
        },
        {
          CLSID: '{B4C01D60-A8A3-4237-BD72-CA7655BC0FE9}'
        },
        {
          CLSID: '{B4C01D60-A8A3-4237-BD72-CA7655BC0FE9}'
        },
        {
          CLSID: '{B4C01D60-A8A3-4237-BD72-CA7655BC0FE9}'
        },
        {
          CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}'
        },
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}'
        },
        {
          CLSID: '{RKL609_R}'
        }
      ]
    }
  ]
}

export default aircraftDefinition
