import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 30,
    display_name: 'Mirage F1EE',
    flare: 15,
    max_fuel: 3356,
    max_height: 15240,
    max_speed: 1390,
    name: 'Mirage-F1EE',
    availableTasks: [
      'CAP',
      'Fighter Sweep',
      'Intercept',
      'Pinpoint Strike',
      'Ground Attack',
      'Escort'
    ],
    carrierCapable: false,
    controllable: true,
    cruiseAltitude: 6096,
    cruiseSpeed: 251.80555555556,
    era: 'Late CW',
    isHelicopter: false,
    loadouts: [
      {
        task: 'default',
        name: 'Default',
        displayName: 'Default',
        pylons: [
          { CLSID: '{AIM-9JULI}', num: 1 },
          {
            CLSID: '<CLEAN>',
            num: 2
          },
          { CLSID: '{R530F_EM}', num: 3 },
          { CLSID: 'PTB-1200-F1', num: 4 },
          { CLSID: '{R530F_EM}', num: 5 },
          {
            CLSID: '<CLEAN>',
            num: 6
          },
          { CLSID: '{AIM-9JULI}', num: 7 }
        ]
      },
      {
        task: 'CAS',
        name: 'CAS',
        displayName: 'CAS',
        pylons: [
          {
            CLSID: '{AIM-9JULI}',
            num: 1
          },
          {
            CLSID: '{MATRA_F1_SNEBT253}',
            num: 2
          },
          {
            CLSID: '{MATRA_F1_SNEBT253}',
            num: 3
          },
          {
            CLSID: '<CLEAN>',
            num: 4
          },
          {
            CLSID: '{MATRA_F1_SNEBT253}',
            num: 5
          },
          {
            CLSID: '{MATRA_F1_SNEBT253}',
            num: 6
          },
          {
            CLSID: '{AIM-9JULI}',
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
            CLSID: '{AIM-9JULI}',
            num: 1
          },
          {
            CLSID: '{SAMP400LD}',
            num: 2
          },
          {
            CLSID: '{SAMP400LD}',
            num: 3
          },
          {
            CLSID: '{CLB4_SAMP400LD}',
            num: 4
          },
          {
            CLSID: '{SAMP400LD}',
            num: 5
          },
          {
            CLSID: '{SAMP400LD}',
            num: 6
          },
          {
            CLSID: '{AIM-9JULI}',
            num: 7
          }
        ]
      },
      {
        task: 'SEAD',
        name: 'SEAD',
        displayName: 'SEAD',
        pylons: [
          {
            CLSID: '{AIM-9JULI}',
            num: 1
          },
          {
            CLSID: '{MATRA_F1_SNEBT257}',
            num: 2
          },
          {
            CLSID: '{MATRA_F1_SNEBT257}',
            num: 3
          },
          {
            CLSID: '<CLEAN>',
            num: 4
          },
          {
            CLSID: '{MATRA_F1_SNEBT257}',
            num: 5
          },
          {
            CLSID: '{MATRA_F1_SNEBT257}',
            num: 6
          },
          {
            CLSID: '{AIM-9JULI}',
            num: 7
          }
        ]
      },
      {
        task: 'DEAD',
        name: 'DEAD',
        displayName: 'DEAD',
        pylons: [
          {
            CLSID: '{AIM-9JULI}',
            num: 1
          },
          {
            CLSID: '{MATRA_F1_SNEBT257}',
            num: 2
          },
          {
            CLSID: '{MATRA_F1_SNEBT257}',
            num: 3
          },
          {
            CLSID: '<CLEAN>',
            num: 4
          },
          {
            CLSID: '{MATRA_F1_SNEBT257}',
            num: 5
          },
          {
            CLSID: '{MATRA_F1_SNEBT257}',
            num: 6
          },
          {
            CLSID: '{AIM-9JULI}',
            num: 7
          }
        ]
      }
    ]
  }

export default aircraftDefinition
