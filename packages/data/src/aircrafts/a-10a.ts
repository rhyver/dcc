import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 240,
  display_name: 'A-10A',
  flare: 120,
  max_fuel: 5029,
  max_height: 10000,
  max_speed: 720,
  name: 'A-10A',
  availableTasks: ['CAS', 'Ground Attack', 'Pinpoint Strike'],
  carrierCapable: false,
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 133.61111111111,
  era: 'Vietnam',
  isHelicopter: false,
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'default',
      pylons: [
        { CLSID: '{6D21ECEA-F85B-4E8D-9D51-31DC9B8AA4EF}', num: 1 },
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 2 },
        { CLSID: '{E6A6262A-CA08-4B3D-B030-E1A993B98452}', num: 3 },
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 4 },
        { CLSID: '{5335D97A-35A5-4643-9D9B-026C75961E52}', num: 5 },
        {
          CLSID: '<CLEAN>',
          num: 6
        },
        { CLSID: '{5335D97A-35A5-4643-9D9B-026C75961E52}', num: 7 },
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 8 },
        { CLSID: '{E6A6262A-CA08-4B3D-B030-E1A993B98453}', num: 9 },
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 10 },
        { CLSID: '{DB434044-F5D0-4F1F-9BA9-B73027E18DD3}', num: 11 }
      ]
    },
    {
      task: 'Pinpoint Strike',
      name: 'Strike',
      displayName: 'Strike',
      pylons: [
        {
          CLSID: 'ALQ_184',
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
          CLSID: '{AB8B8299-F1CC-4359-89B5-2172E0CF4A5A}',
          num: 4
        },
        {
          CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}',
          num: 5
        },
        {
          CLSID: '<CLEAN>',
          num: 6
        },
        {
          CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}',
          num: 7
        },
        {
          CLSID: '{AB8B8299-F1CC-4359-89B5-2172E0CF4A5A}',
          num: 8
        },
        {
          CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}',
          num: 9
        },
        {
          CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}',
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
