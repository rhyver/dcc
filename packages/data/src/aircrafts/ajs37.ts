import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 210,
  display_name: 'AJS37',
  flare: 72,
  max_fuel: 4476,
  max_height: 21000,
  max_speed: 2203.2,
  name: 'AJS37',
  availableTasks: [
    'CAP',
    'Fighter Sweep',
    'Ground Attack',
    'Pinpoint Strike',
    'CAS',
    'Intercept',
    'Antiship Strike'
  ],
  carrierCapable: false,
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 220.97222222222,
  era: 'Late CW',
  isHelicopter: false,
  AddPropAircraft: {
    Rb04GroupTarget: 3,
    WeapSafeHeight: 1,
    Rb04VinkelHopp: 0,
    MissionGeneratorSetting: 0
  },
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'Default',
      pylons: []
    },
    {
      task: 'Antiship Strike',
      name: 'Antiship Strike',
      displayName: 'Antiship Strike',
      pylons: [
        { CLSID: '{Rb15_HB}', num: 2 },
        { CLSID: '{Robot74}', num: 3 },
        { CLSID: '{VIGGEN_X-TANK}', num: 4 },
        { CLSID: '{Robot74}', num: 5 },
        { CLSID: '{Rb15_HB}', num: 6 }
      ]
    }
  ]
}

export default aircraftDefinition
