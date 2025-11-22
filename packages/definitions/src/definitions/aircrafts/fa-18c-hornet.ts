import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 60,
    display_name: 'F/A-18C',
    flare: 60,
    max_fuel: 4900,
    max_height: 18200,
    max_speed: 1950.12,
    name: 'FA-18C_hornet',
    availableTasks: [
      'SEAD',
      'DEAD',
      'CAP',
      'CAS',
      'Escort',
      'Fighter Sweep',
      'Ground Attack',
      'Intercept',
      'Pinpoint Strike',
      'Runway Attack'
    ],
    controllable: true,
    isHelicopter: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 220.97222222222,
    era: 'Modern',
    carrierCapable: true,
    loadouts: [
      {
        task: 'CAS',
        name: 'CAS',
        displayName: 'CAS',
        pylons: [
          {
            CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}',
            num: 1
          },
          {
            CLSID: 'LAU_117_AGM_65F',
            num: 2
          },
          {
            CLSID: '{BRU33_2X_GBU-12}',
            num: 3
          },
          {
            CLSID: '{AN_ASQ_228}',
            num: 4
          },
          {
            CLSID: '{EFEC8201-B922-11d7-9897-000476191836}',
            num: 5
          },
          {
            CLSID: '{8D399DDA-FF81-4F14-904D-099B34FE7918}',
            num: 6
          },
          {
            CLSID: '{BRU33_2X_GBU-12}',
            num: 7
          },
          {
            CLSID: 'LAU_117_AGM_65F',
            num: 8
          },
          {
            CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}',
            num: 9
          }
        ]
      },
      {
        task: 'Pinpoint Strike',
        name: 'Pinpoint Strike',
        displayName: 'Pinpoint Strike',
        pylons: [
          {
            CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
            num: 1
          },
          {
            CLSID: '{BRU55_2*GBU-38}',
            num: 2
          },
          {
            CLSID: '{GBU_32_V_2B}',
            num: 3
          },
          {
            CLSID: '{AN_ASQ_228}',
            num: 4
          },
          {
            CLSID: '{FPU_8A_FUEL_TANK}',
            num: 5
          },
          {
            CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
            num: 6
          },
          {
            CLSID: '{GBU_32_V_2B}',
            num: 7
          },
          {
            CLSID: '{BRU55_2*GBU-38}',
            num: 8
          },
          {
            CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
            num: 9
          }
        ]
      },
      {
        task: 'DEAD',
        name: 'DEAD',
        displayName: 'DEAD',
        pylons: [
          {
            CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
            num: 1
          },
          {
            CLSID: '{9BCC2A2B-5708-4860-B1F1-053A18442067}',
            num: 2
          },
          {
            CLSID: '{B06DD79A-F21E-4EB9-BD9D-AB3844618C93}',
            num: 3
          },
          {
            CLSID: '{AN_ASQ_228}',
            num: 4
          },
          {
            CLSID: '{FPU_8A_FUEL_TANK}',
            num: 5
          },
          {
            CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
            num: 6
          },
          {
            CLSID: '{B06DD79A-F21E-4EB9-BD9D-AB3844618C93}',
            num: 7
          },
          {
            CLSID: '{9BCC2A2B-5708-4860-B1F1-053A18442067}',
            num: 8
          },
          {
            CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
            num: 9
          }
        ]
      },
      {
        task: 'default',
        name: 'AIM-120C*4, AIM-9X*2, FUEL*2',
        displayName: 'AIM-120C*4, AIM-9X*2, FUEL*2',
        pylons: [
          {
            CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
            num: 1
          },
          {
            CLSID: 'LAU-115_2*LAU-127_AIM-120C',
            num: 2
          },
          {
            CLSID: '{FPU_8A_FUEL_TANK}',
            num: 3
          },
          {
            CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
            num: 4
          },
          {
            CLSID: '<CLEAN>',
            num: 5
          },
          {
            CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
            num: 6
          },
          {
            CLSID: '{FPU_8A_FUEL_TANK}',
            num: 7
          },
          {
            CLSID: 'LAU-115_2*LAU-127_AIM-120C',
            num: 8
          },
          {
            CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
            num: 9
          }
        ]
      }
    ]
  }

export default aircraftDefinition
