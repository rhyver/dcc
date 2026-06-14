import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 0,
  display_name: 'F-100D',
  flare: 0,
  ammo_type: 2,
  gun: 100,
  max_fuel: 3505.4,
  max_height: 15240,
  max_speed: 1487,
  name: 'F-100D',
  availableTasks: [
    'CAP',
    'Escort',
    'Fighter Sweep',
    'Intercept',
    'Pinpoint Strike',
    'Ground Attack',
    'Runway Attack',
    'CAS',
    'SEAD'
  ],
  carrierCapable: false,
  controllable: true,
  cruiseAltitude: 4572,
  cruiseSpeed: 190.13888888889,
  era: 'Vietnam',
  isHelicopter: false,
  AddPropAircraft: {
    BURNER_OPTION: 0,
    RHAW_OPTION: false,
    PROBE_OPTION: 0
  },
  loadouts: [
    {
      task: 'default',
      name: 'Default',
      displayName: 'Default',
      pylons: [
        { CLSID: '<CLEAN>', num: 1 },
        { CLSID: '{GD_F100_335_GAL_TANK_L}', num: 2 },
        { CLSID: '{GD_F100_AIM-9J_x2}', num: 3 },
        { CLSID: '{GD_F100_AIM-9J_x2}', num: 5 },
        { CLSID: '{GD_F100_335_GAL_TANK_R}', num: 6 },
        { CLSID: '<CLEAN>', num: 7 }
      ]
    },
    {
      task: 'CAP',
      name: 'CAP',
      displayName: 'CAP',
      pylons: [
        { CLSID: '<CLEAN>', num: 1 },
        { CLSID: '{GD_F100_335_GAL_TANK_L}', num: 2 },
        { CLSID: '{GD_F100_AIM-9J_x2}', num: 3 },
        { CLSID: '{GD_F100_AIM-9J_x2}', num: 5 },
        { CLSID: '{GD_F100_335_GAL_TANK_R}', num: 6 },
        { CLSID: '<CLEAN>', num: 7 }
      ]
    },
    {
      task: 'CAS',
      name: 'CAS',
      displayName: 'CAS',
      pylons: [
        { CLSID: '{ADD3FAE1-EBF6-4EF9-8EFC-B36B5DDF1E6B}', num: 1 },
        { CLSID: '{GD_F100_335_GAL_TANK_L}', num: 2 },
        { CLSID: '{GD_F100_TER_ROCKEYE_x3}', num: 3 },
        { CLSID: '{GD_F100_TER_ROCKEYE_x3}', num: 5 },
        { CLSID: '{GD_F100_335_GAL_TANK_R}', num: 6 },
        { CLSID: '{ADD3FAE1-EBF6-4EF9-8EFC-B36B5DDF1E6B}', num: 7 }
      ]
    },
    {
      task: 'Ground Attack',
      name: 'Ground Attack',
      displayName: 'Ground Attack',
      pylons: [
        { CLSID: '{ADD3FAE1-EBF6-4EF9-8EFC-B36B5DDF1E6B}', num: 1 },
        { CLSID: '{GD_F100_335_GAL_TANK_L}', num: 2 },
        { CLSID: '{GD_F100_TER_ROCKEYE_x3}', num: 3 },
        { CLSID: '{GD_F100_TER_ROCKEYE_x3}', num: 5 },
        { CLSID: '{GD_F100_335_GAL_TANK_R}', num: 6 },
        { CLSID: '{ADD3FAE1-EBF6-4EF9-8EFC-B36B5DDF1E6B}', num: 7 }
      ]
    },
    {
      task: 'Pinpoint Strike',
      name: 'Pinpoint Strike',
      displayName: 'Pinpoint Strike',
      pylons: [
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 1 },
        { CLSID: '{GD_F100_335_GAL_TANK_L}', num: 2 },
        { CLSID: '{GD_F100_TER_MK-82_x3}', num: 3 },
        { CLSID: '{GD_F100_TER_MK-82_x3}', num: 5 },
        { CLSID: '{GD_F100_335_GAL_TANK_R}', num: 6 },
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 7 }
      ]
    },
    {
      task: 'Runway Attack',
      name: 'Runway Attack',
      displayName: 'Runway Attack',
      pylons: [
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 1 },
        { CLSID: '{GD_F100_335_GAL_TANK_L}', num: 2 },
        { CLSID: '{GD_F100_TER_MK-82_x3}', num: 3 },
        { CLSID: '{GD_F100_TER_MK-82_x3}', num: 5 },
        { CLSID: '{GD_F100_335_GAL_TANK_R}', num: 6 },
        { CLSID: '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}', num: 7 }
      ]
    },
    {
      task: 'SEAD',
      name: 'SEAD',
      displayName: 'SEAD',
      pylons: [
        { CLSID: '{LAU3_FFAR_MK5HEAT}', num: 1 },
        { CLSID: '{GD_F100_335_GAL_TANK_L}', num: 2 },
        { CLSID: '{AGM_45A}', num: 3 },
        { CLSID: '{AGM_45A}', num: 5 },
        { CLSID: '{GD_F100_335_GAL_TANK_R}', num: 6 },
        { CLSID: '{LAU3_FFAR_MK5HEAT}', num: 7 }
      ]
    }
  ]
}

export default aircraftDefinition
