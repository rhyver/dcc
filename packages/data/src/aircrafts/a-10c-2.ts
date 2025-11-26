import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 240,
  display_name: 'A-10C II',
  flare: 240,
  max_fuel: 5029,
  max_height: 10000,
  max_speed: 720,
  name: 'A-10C_2',
  availableTasks: ['CAS', 'Ground Attack', 'Pinpoint Strike'],
  carrierCapable: false,
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 133.61111111111,
  era: 'Modern',
  isHelicopter: false,
  customCallsigns: ['Hawg', 'Boar', 'Pig', 'Tusk'],
  loadouts: [
    {
      task: 'default',
      displayName: 'default',
      name: 'default',
      pylons: [
        { CLSID: 'ALQ_184', num: 1 },
        { CLSID: '{69926055-0DA8-4530-9F2F-C86B157EA9F6}', num: 2 },
        { CLSID: 'LAU_88_AGM_65H_2_L', num: 3 },
        { CLSID: '{DB769D48-67D7-42ED-A2BE-108D566C8B1E}', num: 4 },
        { CLSID: '{GBU-38}', num: 5 },
        {
          CLSID: '<CLEAN>',
          num: 6
        },
        { CLSID: '{GBU-38}', num: 7 },
        { CLSID: '{DB769D48-67D7-42ED-A2BE-108D566C8B1E}', num: 8 },
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
