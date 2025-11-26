import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 48,
  display_name: 'Su-33',
  flare: 48,
  max_fuel: 9500,
  max_height: 17000,
  max_speed: 2300,
  name: 'Su-33',
  availableTasks: ['CAP', 'Escort', 'Intercept', 'Fighter Sweep', 'Pinpoint Strike'],
  controllable: true,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 251.80555555556,
  era: 'Modern',
  carrierCapable: true,
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'default',
      pylons: [
        {
          CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82F}',
          num: 1
        },
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}',
          num: 2
        },
        {
          CLSID: '{B79C379A-9E87-4E50-A1EE-7F7E29C2E87A}',
          num: 3
        },
        {
          CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}',
          num: 4
        },
        {
          CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}',
          num: 5
        },
        {
          CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}',
          num: 6
        },
        {
          CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}',
          num: 7
        },
        {
          CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}',
          num: 8
        },
        {
          CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}',
          num: 9
        },
        {
          CLSID: '{B79C379A-9E87-4E50-A1EE-7F7E29C2E87A}',
          num: 10
        },
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}',
          num: 11
        },
        {
          CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82A}',
          num: 12
        }
      ]
    },
    {
      task: 'Pinpoint Strike',
      name: 'Strike',
      displayName: 'Strike',
      pylons: [
        {
          CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82F}',
          num: 1
        },
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}',
          num: 2
        },
        {
          CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}',
          num: 3
        },
        {
          CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}',
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
          CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}',
          num: 7
        },
        {
          CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}',
          num: 8
        },
        {
          CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}',
          num: 9
        },
        {
          CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}',
          num: 10
        },
        {
          CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}',
          num: 11
        },
        {
          CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82A}',
          num: 12
        }
      ]
    }
  ]
}

export default aircraftDefinition
