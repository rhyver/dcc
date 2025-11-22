import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 120,
    display_name: 'F-15E',
    flare: 60,
    max_fuel: 10245.529841878,
    max_height: 18300,
    max_speed: 2649.996,
    name: 'F-15ESE',
    availableTasks: [
      'CAP',
      'Escort',
      'Ground Attack',
      'CAS',
      'Intercept',
      'Pinpoint Strike',
      'Fighter Sweep',
      'Runway Attack'
    ],
    controllable: true,
    isHelicopter: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 251.80555555556,
    era: 'Modern',
    carrierCapable: false,
    loadouts: [
      {
        task: 'Pinpoint Strike',
        name: 'Strike',
        displayName: 'Strike',
        pylons: [
          {
            CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
            num: 1
          },
          {
            CLSID: '{F15E_EXTTANK}',
            num: 2
          },
          {
            CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}',
            num: 3
          },
          {
            CLSID: '{CFT_L_GBU_12_x_4}',
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
            CLSID: '{F-15E_AAQ-14_LANTIRN}',
            num: 7
          },
          {
            CLSID: '<CLEAN>',
            num: 8
          },
          {
            CLSID: '{F-15E_AAQ-13_LANTIRN}',
            num: 9
          },
          {
            CLSID: '<CLEAN>',
            num: 10
          },
          {
            CLSID: '<CLEAN>',
            num: 11
          },
          {
            CLSID: '{CFT_R_GBU_10_x_2}',
            num: 12
          },
          {
            CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}',
            num: 13
          },
          {
            CLSID: '{F15E_EXTTANK}',
            num: 14
          },
          {
            CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
            num: 15
          }
        ]
      },
      {
        task: 'CAS',
        name: 'CAS',
        displayName: 'CAS',
        pylons: [
          {
            CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
            num: 1
          },
          {
            CLSID: '{F15E_EXTTANK}',
            num: 2
          },
          {
            CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}',
            num: 3
          },
          {
            CLSID: '{CFT_L_GBU_12_x_4}',
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
            CLSID: '{F-15E_AAQ-14_LANTIRN}',
            num: 7
          },
          {
            CLSID: '{DB769D48-67D7-42ED-A2BE-108D566C8B1E}',
            num: 8
          },
          {
            CLSID: '{F-15E_AAQ-13_LANTIRN}',
            num: 9
          },
          {
            CLSID: '<CLEAN>',
            num: 10
          },
          {
            CLSID: '<CLEAN>',
            num: 11
          },
          {
            CLSID: '{CFT_R_GBU_12_x_4}',
            num: 12
          },
          {
            CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}',
            num: 13
          },
          {
            CLSID: '{F15E_EXTTANK}',
            num: 14
          },
          {
            CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
            num: 15
          }
        ]
      },
      {
        task: 'default',
        name: 'default',
        displayName: 'default',
        pylons: [
          {
            CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}'
          },
          {
            CLSID: '{F15E_EXTTANK}'
          },
          {
            CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}'
          },
          {
            CLSID: '<CLEAN>'
          },
          {
            CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}'
          },
          {
            CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}'
          },
          {
            CLSID: '<CLEAN>'
          },
          {
            CLSID: '<CLEAN>'
          },
          {
            CLSID: '<CLEAN>'
          },
          {
            CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}'
          },
          {
            CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}'
          },
          {
            CLSID: '<CLEAN>'
          },
          {
            CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}'
          },
          {
            CLSID: '{F15E_EXTTANK}'
          },
          {
            CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}'
          }
        ]
      }
    ]
  }

export default aircraftDefinition
