import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 60,
  display_name: 'F-16C',
  flare: 60,
  gun: 100,
  ammo_type: 5,
  max_fuel: 3249,
  max_height: 15240,
  max_speed: 2120.04,
  name: 'F-16C_50',
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
  carrierCapable: false,
  AddPropAircraft: {
    STN_L16: '{STN_L16}',
    VoiceCallsignNumber: '{VoiceCallsignNumber}',
    VoiceCallsignLabel: 'ED',
    HelmetMountedDevice: 1,
    LAU3ROF: 0,
    LaserCode100: 6,
    LaserCode1: 8,
    LaserCode10: 8
  },
  datalinks: {
    Link16: {
      settings: {
        flightLead: true,
        transmitPower: 3,
        specialChannel: 1,
        fighterChannel: 1,
        missionChannel: 1
      }
    }
  },
  customCallsigns: [
    'Viper',
    'Venom',
    'Lobo',
    'Cowboy',
    'Python',
    'Wolf',
    'Weasel',
    'Wild',
    'Ninja',
    'Jedi'
  ],
  loadouts: [
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
          CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
          num: 2
        },
        {
          CLSID: '{BRU57_2*CBU-103}',
          num: 3
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 4
        },
        {
          CLSID: 'ALQ_184_Long',
          num: 5
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 6
        },
        {
          CLSID: '{BRU57_2*CBU-105}',
          num: 7
        },
        {
          CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
          num: 8
        },
        {
          CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
          num: 9
        },
        {
          CLSID: '<CLEAN>',
          num: 10
        },
        {
          CLSID: '{A111396E-D3E8-4b9c-8AC9-2432489304D5}',
          num: 11
        }
      ]
    },
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
          CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
          num: 2
        },
        {
          CLSID: '{BRU57_2*GBU-38}',
          num: 3
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 4
        },
        {
          CLSID: 'ALQ_184_Long',
          num: 5
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 6
        },
        {
          CLSID: '{BRU57_2*GBU-38}',
          num: 7
        },
        {
          CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
          num: 8
        },
        {
          CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
          num: 9
        },
        {
          CLSID: '<CLEAN>',
          num: 10
        },
        {
          CLSID: '{A111396E-D3E8-4b9c-8AC9-2432489304D5}',
          num: 11
        }
      ]
    },
    {
      task: 'DEAD',
      name: 'DEAD',
      displayName: 'DEAD',
      pylons: [
        {
          CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
          num: 1
        },
        {
          CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
          num: 2
        },
        {
          CLSID: '{B06DD79A-F21E-4EB9-BD9D-AB3844618C93}',
          num: 3
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 4
        },
        {
          CLSID: 'ALQ_184_Long',
          num: 5
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 6
        },
        {
          CLSID: '{B06DD79A-F21E-4EB9-BD9D-AB3844618C93}',
          num: 7
        },
        {
          CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
          num: 8
        },
        {
          CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
          num: 9
        },
        {
          CLSID: '{AN_ASQ_213}',
          num: 10
        },
        {
          CLSID: '{A111396E-D3E8-4b9c-8AC9-2432489304D5}',
          num: 11
        }
      ]
    },
    {
      task: 'SEAD',
      name: 'SEAD',
      displayName: 'SEAD',
      pylons: [
        {
          CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
          num: 1
        },
        {
          CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
          num: 2
        },
        {
          CLSID: '{B06DD79A-F21E-4EB9-BD9D-AB3844618C93}',
          num: 3
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 4
        },
        {
          CLSID: 'ALQ_184_Long',
          num: 5
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 6
        },
        {
          CLSID: '{B06DD79A-F21E-4EB9-BD9D-AB3844618C93}',
          num: 7
        },
        {
          CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
          num: 8
        },
        {
          CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
          num: 9
        },
        {
          CLSID: '{AN_ASQ_213}',
          num: 10
        },
        {
          CLSID: '{A111396E-D3E8-4b9c-8AC9-2432489304D5}',
          num: 11
        }
      ]
    },
    {
      task: 'default',
      name: 'AIM-120C*4, AIM-9X*2, FUEL*2',
      displayName: 'AIM-120C*4, AIM-9X*2, FUEL*2',
      pylons: [
        {
          CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
          num: 1
        },
        {
          CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
          num: 2
        },
        {
          CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
          num: 3
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 4
        },
        {
          CLSID: '<CLEAN>',
          num: 5
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 6
        },
        {
          CLSID: '{5CE2FF2A-645A-4197-B48D-8720AC69394F}',
          num: 7
        },
        {
          CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
          num: 8
        },
        {
          CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
          num: 9
        }
      ]
    }
  ]
}

export default aircraftDefinition
