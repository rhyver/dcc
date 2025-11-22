import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 234,
    display_name: 'M-2000C',
    flare: 64,
    max_fuel: 3165,
    max_height: 17526,
    max_speed: 2376,
    name: 'M-2000C',
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
          { CLSID: '{MMagicII}', num: 1 },
          { CLSID: '{M2KC_RAFAUT_MK82S}', num: 2 },
          { CLSID: '{Mk82SNAKEYE}', num: 3 },
          { CLSID: '{Mk82SNAKEYE}', num: 4 },
          {
            CLSID: '<CLEAN>',
            num: 5
          },
          { CLSID: '{Mk82SNAKEYE}', num: 6 },
          { CLSID: '{Mk82SNAKEYE}', num: 7 },
          { CLSID: '{M2KC_RAFAUT_MK82S}', num: 8 },
          { CLSID: '{MMagicII}', num: 9 }
        ]
      },
      {
        task: 'CAP',
        name: 'Default',
        displayName: 'Default',
        pylons: [
          { CLSID: '{MMagicII}', num: 1 },
          { CLSID: '{Matra_S530D}', num: 2 },
          { CLSID: '<CLEAN>', num: 3 },
          { CLSID: '<CLEAN>', num: 4 },
          {
            CLSID: '{M2KC_RPL_522}',
            num: 5
          },
          { CLSID: '<CLEAN>', num: 6 },
          { CLSID: '<CLEAN>', num: 7 },
          { CLSID: '{Matra_S530D}', num: 8 },
          { CLSID: '{MMagicII}', num: 9 }
        ]
      },
      {
        task: 'Escort',
        name: 'Default',
        displayName: 'Default',
        pylons: [
          { CLSID: '{MMagicII}', num: 1 },
          { CLSID: '{Matra_S530D}', num: 2 },
          { CLSID: '<CLEAN>', num: 3 },
          { CLSID: '<CLEAN>', num: 4 },
          {
            CLSID: '{M2KC_RPL_522}',
            num: 5
          },
          { CLSID: '<CLEAN>', num: 6 },
          { CLSID: '<CLEAN>', num: 7 },
          { CLSID: '{Matra_S530D}', num: 8 },
          { CLSID: '{MMagicII}', num: 9 }
        ]
      }
    ]
  }

export default aircraftDefinition
