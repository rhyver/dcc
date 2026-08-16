import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 30,
  display_name: 'F-5E',
  flare: 15,
  max_fuel: 2046,
  max_height: 16154,
  max_speed: 1742.4,
  name: 'F-5E-3',
  availableTasks: ['CAP', 'Escort', 'Intercept', 'CAS', 'Pinpoint Strike', 'Antiship Strike'],
  controllable: true,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 174.72222222222,
  maxWaypoints: 3,
  era: 'Vietnam',
  carrierCapable: false,
  loadouts: [
    {
      task: 'default',
      name: 'AIM_54_Mk60*4',
      displayName: 'AIM_54_Mk60*4',
      pylons: [
        { CLSID: '{AIM-9B}', num: 1 },
        {
          CLSID: '<CLEAN>',
          num: 2
        },
        { CLSID: '{PTB-150GAL}', num: 3 },
        { CLSID: '{PTB-150GAL}', num: 4 },
        { CLSID: '{PTB-150GAL}', num: 5 },
        {
          CLSID: '<CLEAN>',
          num: 6
        },
        { CLSID: '{AIM-9B}', num: 7 }
      ]
    },
    {
      task: 'CAS',
      name: 'CAS',
      displayName: 'CAS',
      pylons: [
        { CLSID: '{9BFD8C90-F7AE-4e90-833B-BFD0CED0E536}', num: 1 },
        { CLSID: 'LAU3_HE5', num: 2 },
        { CLSID: 'LAU3_HE5', num: 3 },
        { CLSID: '{0395076D-2F77-4420-9D33-087A4398130B}', num: 4 },
        { CLSID: 'LAU3_HE5', num: 5 },
        { CLSID: 'LAU3_HE5', num: 6 },
        { CLSID: '{9BFD8C90-F7AE-4e90-833B-BFD0CED0E536}', num: 7 }
      ]
    },
    {
      task: 'Pinpoint Strike',
      name: 'Pinpoint Strike',
      displayName: 'Pinpoint Strike',
      pylons: [
        { CLSID: '{9BFD8C90-F7AE-4e90-833B-BFD0CED0E536}', num: 1 },
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 2 },
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 3 },
        { CLSID: '{0395076D-2F77-4420-9D33-087A4398130B}', num: 4 },
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 5 },
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 6 },
        { CLSID: '{9BFD8C90-F7AE-4e90-833B-BFD0CED0E536}', num: 7 }
      ]
    },
    {
      task: 'Antiship Strike',
      name: 'Antiship Strike',
      displayName: 'Antiship Strike',
      pylons: [
        { CLSID: '{AIM-9P5}', num: 1 },
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 2 },
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 3 },
        { CLSID: '{PTB-150GAL}', num: 4 },
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 5 },
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 6 },
        { CLSID: '{AIM-9P5}', num: 7 }
      ]
    }
  ]
}

export default aircraftDefinition
