import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 240,
  display_name: 'A-10C',
  flare: 120,
  max_fuel: 5029,
  max_height: 10000,
  max_speed: 720,
  name: 'A-10C',
  availableTasks: ['CAS', 'Ground Attack', 'Pinpoint Strike'],
  carrierCapable: false,
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 133.61111111111,
  era: 'Late CW',
  isHelicopter: false,
  loadouts: [
    {
      task: 'default',
      displayName: 'default',
      name: 'default',
      pylons: [
        { CLSID: 'ALQ_184', num: 1 },
        {
          CLSID: '<CLEAN>',
          num: 2
        },
        { CLSID: 'LAU_88_AGM_65H_2_L', num: 3 },
        { CLSID: '{5335D97A-35A5-4643-9D9B-026C75961E52}', num: 4 },
        { CLSID: '{CBU-87}', num: 5 },
        {
          CLSID: '<CLEAN>',
          num: 6
        },
        { CLSID: '{CBU-87}', num: 7 },
        { CLSID: '{5335D97A-35A5-4643-9D9B-026C75961E52}', num: 8 },
        { CLSID: '{E6A6262A-CA08-4B3D-B030-E1A993B98453}', num: 9 },
        { CLSID: '{A111396E-D3E8-4b9c-8AC9-2432489304D5}', num: 10 },
        { CLSID: '{DB434044-F5D0-4F1F-9BA9-B73027E18DD3}', num: 11 }
      ]
    },
    {
      task: 'Pinpoint Strike',
      displayName: 'Strike',
      name: 'Strike',
      pylons: [
        {
          CLSID: 'ALQ_184',
          num: 1
        },
        {
          CLSID: '<CLEAN>',
          num: 2
        },
        {
          CLSID: '{69DC8AE7-8F77-427B-B8AA-B19D3F478B66}',
          num: 3
        },
        {
          CLSID: '{GBU-38}',
          num: 4
        },
        {
          CLSID: '{GBU-38}',
          num: 5
        },
        {
          CLSID: '<CLEAN>',
          num: 6
        },
        {
          CLSID: '{GBU-38}',
          num: 7
        },
        {
          CLSID: '{GBU-38}',
          num: 8
        },
        {
          CLSID: '{69DC8AE7-8F77-427B-B8AA-B19D3F478B66}',
          num: 9
        },
        {
          CLSID: '{A111396E-D3E8-4b9c-8AC9-2432489304D5}',
          num: 10
        },
        {
          CLSID: '{DB434044-F5D0-4F1F-9BA9-B73027E18DD3}',
          num: 11
        }
      ]
    }
  ]
}

export default aircraftDefinition
