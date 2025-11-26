import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 0,
  display_name: 'C-101CC',
  flare: 0,
  max_fuel: 1796,
  max_height: 11000,
  max_speed: 925.2,
  name: 'C-101CC',
  availableTasks: ['CAS', 'Pinpoint Strike'],
  carrierCapable: false,
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 133.61111111111,
  era: 'Late CW',
  isHelicopter: false,
  loadouts: [
    {
      task: 'CAS',
      displayName: 'CAS',
      name: 'CAS',
      pylons: [
        {
          CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}',
          num: 1
        },
        {
          CLSID: '{08164777-5E9C-4B08-B48E-5AA7AFB246E2}',
          num: 2
        },
        {
          CLSID: '{A021F29D-18AB-4d3e-985C-FC9C60E35E9E}',
          num: 3
        },
        {
          CLSID: '{AN-M3}',
          num: 4
        },
        {
          CLSID: '{A021F29D-18AB-4d3e-985C-FC9C60E35E9E}',
          num: 5
        },
        {
          CLSID: '{08164777-5E9C-4B08-B48E-5AA7AFB246E2}',
          num: 6
        },
        {
          CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}',
          num: 7
        }
      ]
    },
    {
      task: 'default',
      displayName: 'Default',
      name: 'Default',
      pylons: [
        {
          CLSID: '{9BFD8C90-F7AE-4e90-833B-BFD0CED0E536}',
          num: 1
        },
        {
          CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}',
          num: 2
        },
        {
          CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}',
          num: 3
        },
        {
          CLSID: '<CLEAN>',
          num: 4
        },
        {
          CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}',
          num: 5
        },
        {
          CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}',
          num: 6
        },
        {
          CLSID: '{9BFD8C90-F7AE-4e90-833B-BFD0CED0E536}',
          num: 7
        }
      ]
    }
  ]
}

export default aircraftDefinition
