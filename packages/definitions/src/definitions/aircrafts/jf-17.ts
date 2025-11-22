import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 36,
    display_name: 'JF-17',
    flare: 32,
    max_fuel: 2325,
    max_height: 16920,
    max_speed: 2520,
    name: 'JF-17',
    availableTasks: [
      'Antiship Strike',
      'CAP',
      'CAS',
      'DEAD',
      'Escort',
      'Fighter Sweep',
      'Ground Attack',
      'Intercept',
      'Pinpoint Strike'
    ],
    carrierCapable: false,
    controllable: true,
    cruiseAltitude: 6096,
    cruiseSpeed: 220.97222222222,
    era: 'Modern',
    isHelicopter: false,
    loadouts: [
      {
        task: 'CAS',
        name: 'CAS',
        displayName: 'CAS',
        pylons: [
          {
            CLSID: 'DIS_PL-5EII',
            num: 1
          },
          {
            CLSID: 'DIS_WMD7',
            num: 2
          },
          {
            CLSID: 'DIS_GB6_TSP',
            num: 3
          },
          {
            CLSID: 'DIS_TANK800',
            num: 4
          },
          {
            CLSID: 'DIS_GB6_TSP',
            num: 5
          },
          {
            CLSID: 'DIS_BRM1_90',
            num: 6
          },
          {
            CLSID: 'DIS_PL-5EII',
            num: 7
          }
        ]
      },
      {
        task: 'Ground Attack',
        name: 'Ground Attack',
        displayName: 'Ground Attack',
        pylons: [
          {
            CLSID: 'DIS_PL-5EII',
            num: 1
          },
          {
            CLSID: 'DIS_GBU_12_DUAL_GDJ_II19_L',
            num: 2
          },
          {
            CLSID: 'DIS_TANK1100',
            num: 3
          },
          {
            CLSID: 'DIS_WMD7',
            num: 4
          },
          {
            CLSID: 'DIS_TANK1100',
            num: 5
          },
          {
            CLSID: 'DIS_GBU_12_DUAL_GDJ_II19_R',
            num: 6
          },
          {
            CLSID: 'DIS_PL-5EII',
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
            CLSID: 'DIS_PL-5EII',
            num: 1
          },
          {
            CLSID: 'DIS_LS_6_500',
            num: 2
          },
          {
            CLSID: 'DIS_TANK1100',
            num: 3
          },
          {
            CLSID: 'DIS_WMD7',
            num: 4
          },
          {
            CLSID: 'DIS_TANK1100',
            num: 5
          },
          {
            CLSID: 'DIS_LS_6_500',
            num: 6
          },
          {
            CLSID: 'DIS_PL-5EII',
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
            CLSID: 'DIS_PL-5EII',
            num: 1
          },
          {
            CLSID: 'DIS_LD-10_DUAL_L',
            num: 2
          },
          {
            CLSID: 'DIS_TANK1100',
            num: 3
          },
          {
            CLSID: 'DIS_SPJ_POD',
            num: 4
          },
          {
            CLSID: 'DIS_TANK1100',
            num: 5
          },
          {
            CLSID: 'DIS_LD-10_DUAL_R',
            num: 6
          },
          {
            CLSID: 'DIS_PL-5EII',
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
            CLSID: 'DIS_PL-5EII',
            num: 1
          },
          {
            CLSID: 'DIS_LD-10_DUAL_L',
            num: 2
          },
          {
            CLSID: 'DIS_TANK1100',
            num: 3
          },
          {
            CLSID: 'DIS_SPJ_POD',
            num: 4
          },
          {
            CLSID: 'DIS_TANK1100',
            num: 5
          },
          {
            CLSID: 'DIS_LD-10_DUAL_R',
            num: 6
          },
          {
            CLSID: 'DIS_PL-5EII',
            num: 7
          }
        ]
      },
      {
        task: 'default',
        name: 'SD-10*4, PL-5*2, FUEL*2',
        displayName: 'SD-10*4, PL-5*2, FUEL*2',
        pylons: [
          {
            CLSID: 'DIS_PL-5EII',
            num: 1
          },
          {
            CLSID: 'DIS_SD-10_DUAL_L',
            num: 2
          },
          {
            CLSID: 'DIS_TANK1100',
            num: 3
          },
          { CLSID: '<CLEAN>', num: 4 },
          {
            CLSID: 'DIS_TANK1100',
            num: 5
          },
          {
            CLSID: 'DIS_SD-10_DUAL_R',
            num: 6
          },
          {
            CLSID: 'DIS_PL-5EII',
            num: 7
          }
        ]
      }
    ]
  }

export default aircraftDefinition
