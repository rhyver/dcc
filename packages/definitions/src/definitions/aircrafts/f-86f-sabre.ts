import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 0,
    display_name: 'F-86F',
    flare: 0,
    max_fuel: 1282,
    max_height: 15100,
    max_speed: 964.8,
    name: 'F-86F Sabre',
    availableTasks: [
      'CAP',
      'Fighter Sweep',
      'Intercept',
      'Escort',
      'Pinpoint Strike',
      'Ground Attack',
      'CAS'
    ],
    carrierCapable: false,
    controllable: true,
    cruiseAltitude: 3000,
    cruiseSpeed: 174.72222222222,
    era: 'Korea',
    isHelicopter: false,
    loadouts: [
      {
        task: 'default',
        name: 'Default',
        displayName: 'Default',
        pylons: [
          {
            CLSID: '<CLEAN>',
            num: 1
          },
          {
            CLSID: '<CLEAN>',
            num: 2
          },
          {
            CLSID: '<CLEAN>',
            num: 3
          },
          {
            CLSID: '{PTB_120_F86F35}',
            num: 4
          },
          {
            CLSID: '{GAR-8}',
            num: 5
          },
          {
            CLSID: '{GAR-8}',
            num: 6
          },
          {
            CLSID: '{PTB_120_F86F35}',
            num: 7
          }
        ]
      },
      {
        task: 'CAS',
        name: 'CAS',
        displayName: 'CAS',
        pylons: [
          {
            CLSID: '{PTB_200_F86F35}',
            num: 1
          },
          {
            CLSID: '{HVARx2}',
            num: 2
          },
          {
            CLSID: '{HVARx2}',
            num: 3
          },
          {
            CLSID: '{HVARx2}',
            num: 4
          },
          {
            CLSID: '<CLEAN>',
            num: 5
          },
          {
            CLSID: '<CLEAN>',
            num: 6
          },
          {
            CLSID: '{HVARx2}',
            num: 7
          },
          {
            CLSID: '{HVARx2}',
            num: 8
          },
          {
            CLSID: '{HVARx2}',
            num: 9
          },
          {
            CLSID: '{PTB_200_F86F35}',
            num: 10
          }
        ]
      },
      {
        task: 'Pinpoint Strike',
        name: 'Strike',
        displayName: 'Strike',
        pylons: [
          {
            CLSID: '{PTB_200_F86F35}',
            num: 1
          },
          {
            CLSID: '<CLEAN>',
            num: 2
          },
          {
            CLSID: '<CLEAN>',
            num: 3
          },
          {
            CLSID: '{F86ANM64}',
            num: 4
          },
          {
            CLSID: '<CLEAN>',
            num: 5
          },
          {
            CLSID: '<CLEAN>',
            num: 6
          },
          {
            CLSID: '{F86ANM64}',
            num: 7
          },
          {
            CLSID: '<CLEAN>',
            num: 8
          },
          {
            CLSID: '<CLEAN>',
            num: 9
          },
          {
            CLSID: '{PTB_200_F86F35}',
            num: 10
          }
        ]
      }
    ]
  }

export default aircraftDefinition
