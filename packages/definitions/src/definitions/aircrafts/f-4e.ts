import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 60,
    display_name: 'F-4E',
    flare: 30,
    max_fuel: 4864,
    max_height: 19000,
    max_speed: 2370,
    name: 'F-4E',
    availableTasks: ['CAP', 'Fighter Sweep', 'Ground Attack', 'Pinpoint Strike', 'DEAD'],
    controllable: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 251.80555555556,
    isHelicopter: false,
    era: 'Early CW',
    carrierCapable: false,
    loadouts: [
      {
        task: 'default',
        name: 'AIM-9*4, AIM-7*4, Fuel*2',
        displayName: 'AIM-9*4, AIM-7*4, Fuel*2',
        pylons: [
          { CLSID: '{7B4B122D-C12C-4DB4-834E-4D8BB4D863A8}', num: 1 },
          { CLSID: '{9DDF5297-94B9-42FC-A45E-6E316121CD85}', num: 2 },
          { CLSID: '{8D399DDA-FF81-4F14-904D-099B34FE7918}', num: 3 },
          { CLSID: '{8D399DDA-FF81-4F14-904D-099B34FE7918}', num: 4 },
          {
            CLSID: '<CLEAN>',
            num: 5
          },
          { CLSID: '{8D399DDA-FF81-4F14-904D-099B34FE7918}', num: 6 },
          { CLSID: '{8D399DDA-FF81-4F14-904D-099B34FE7918}', num: 7 },
          { CLSID: '{9DDF5297-94B9-42FC-A45E-6E316121CD85}', num: 8 },
          { CLSID: '{7B4B122D-C12C-4DB4-834E-4D8BB4D863A8}', num: 9 }
        ]
      },
      {
        task: 'DEAD',
        name: 'DEAD',
        displayName: 'DEAD',
        pylons: [
          {
            CLSID: '{7B4B122D-C12C-4DB4-834E-4D8BB4D863A8}',
            num: 1
          },
          {
            CLSID: '{3E6B632D-65EB-44D2-9501-1C2D04515405}',
            num: 2
          },
          {
            CLSID: '{6D21ECEA-F85B-4E8D-9D51-31DC9B8AA4EF}',
            num: 3
          },
          {
            CLSID: '{8D399DDA-FF81-4F14-904D-099B34FE7918}',
            num: 4
          },
          {
            CLSID: '<CLEAN>',
            num: 5
          },
          {
            CLSID: '{8D399DDA-FF81-4F14-904D-099B34FE7918}',
            num: 6
          },
          {
            CLSID: '<CLEAN>',
            num: 7
          },
          {
            CLSID: '{3E6B632D-65EB-44D2-9501-1C2D04515405}',
            num: 8
          },
          {
            CLSID: '{7B4B122D-C12C-4DB4-834E-4D8BB4D863A8}',
            num: 9
          }
        ]
      },
      {
        task: 'Pinpoint Strike',
        name: 'Strike',
        displayName: 'Strike',
        pylons: [
          {
            CLSID: '{1C97B4A0-AA3B-43A8-8EE7-D11071457185}',
            num: 1
          },
          {
            CLSID: '{60CC734F-0AFA-4E2E-82B8-93B941AB11CF}',
            num: 2
          },
          {
            CLSID: '{6D21ECEA-F85B-4E8D-9D51-31DC9B8AA4EF}',
            num: 3
          },
          {
            CLSID: '{8D399DDA-FF81-4F14-904D-099B34FE7918}',
            num: 4
          },
          {
            CLSID: '{8B9E3FD0-F034-4A07-B6CE-C269884CC71B}',
            num: 5
          },
          {
            CLSID: '{8D399DDA-FF81-4F14-904D-099B34FE7918}',
            num: 6
          },
          {
            CLSID: '<CLEAN>',
            num: 7
          },
          {
            CLSID: '{60CC734F-0AFA-4E2E-82B8-93B941AB11CF}',
            num: 8
          },
          {
            CLSID: '{1C97B4A0-AA3B-43A8-8EE7-D11071457185}',
            num: 9
          }
        ]
      }
    ]
  }

export default aircraftDefinition
