import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 30,
    display_name: 'Mirage F1CE',
    flare: 15,
    max_fuel: 3356,
    max_height: 15240,
    max_speed: 1390,
    name: 'Mirage-F1CE',
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
    era: 'Early CW',
    isHelicopter: false,
    AddPropAircraft: {
      RadarCoverSettings: 1,
      RocketSalvoF1: 1,
      GunBurstSettings: 1,
      MissSimplLock: 1,
      ChaffMultiTime: 1,
      FlareMultiNumber: 1,
      ChaffMultiNumber: 1,
      RocketSalvoF4: 1,
      ChaffProgramNumber: 1,
      LaserCode100: 6,
      LaserCode1: 8,
      ChaffProgramTime: 1,
      FlareMultiTime: 1,
      LaserCode10: 8,
      RWR_type: 'ALR_300',
      INSStartMode: 1
    },
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
