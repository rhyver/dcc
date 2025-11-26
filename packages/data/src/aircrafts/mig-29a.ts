import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 30,
  display_name: 'MiG-29A',
  flare: 30,
  max_fuel: 3376,
  max_height: 18000,
  max_speed: 2450,
  name: 'MiG-29A',
  availableTasks: ['CAP', 'Escort', 'Intercept', 'Fighter Sweep', 'Pinpoint Strike'],
  controllable: true,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 220.97222222222,
  era: 'Late CW',
  carrierCapable: false,
  loadouts: [
    {
      task: 'default',
      name: 'R-73*4, R27R*2, Fuel-1500',
      displayName: 'R-73*4, R27R*2, Fuel-1500',
      pylons: [
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}',
          num: 1
        },
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}',
          num: 2
        },
        {
          CLSID: '{9B25D316-0434-4954-868F-D51DB1A38DF0}',
          num: 3
        },
        {
          CLSID: '{2BEC576B-CDF5-4B7F-961F-B0FA4312B841}',
          num: 4
        },
        {
          CLSID: '{9B25D316-0434-4954-868F-D51DB1A38DF0}',
          num: 5
        },
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}',
          num: 6
        },
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}',
          num: 7
        }
      ]
    },
    {
      task: 'Pinpoint Strike',
      name: 'Strike',
      displayName: 'Strike',
      pylons: [
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}',
          num: 1
        },
        {
          CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}',
          num: 2
        },
        {
          CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}',
          num: 3
        },
        {
          CLSID: '{2BEC576B-CDF5-4B7F-961F-B0FA4312B841}',
          num: 4
        },
        {
          CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}',
          num: 5
        },
        {
          CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}',
          num: 6
        },
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}',
          num: 7
        }
      ]
    }
  ]
}

export default aircraftDefinition
