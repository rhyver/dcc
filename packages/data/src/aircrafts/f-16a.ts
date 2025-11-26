import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 60,
  display_name: 'F-16A',
  flare: 30,
  max_fuel: 3104,
  max_height: 19000,
  max_speed: 2150,
  name: 'F-16A',
  availableTasks: [
    'SEAD',
    'DEAD',
    'CAP',
    'CAS',
    'Escort',
    'Fighter Sweep',
    'Ground Attack',
    'Intercept',
    'Pinpoint Strike'
  ],
  carrierCapable: false,
  controllable: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 220.97222222222,
  era: 'Late CW',
  isHelicopter: false,
  loadouts: [
    {
      task: 'default',
      name: 'Default',
      displayName: 'Default',
      pylons: [
        {
          CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}',
          num: 1
        },
        {
          CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}',
          num: 2
        },
        {
          CLSID: '{8D399DDA-FF81-4F14-904D-099B34FE7918}',
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
          CLSID: '{6D21ECEA-F85B-4E8D-9D51-31DC9B8AA4EF}',
          num: 6
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 7
        },
        {
          CLSID: '{8D399DDA-FF81-4F14-904D-099B34FE7918}',
          num: 8
        },
        {
          CLSID: '{AIM-9L}',
          num: 9
        },
        {
          CLSID: '{AIM-9L}',
          num: 10
        }
      ]
    },
    {
      task: 'CAS',
      name: 'CAS',
      displayName: 'CAS',
      pylons: [
        {
          CLSID: '{C8E06185-7CD6-4C90-959F-044679E90751}',
          num: 1
        },
        {
          CLSID: '<CLEAN>',
          num: 2
        },
        {
          CLSID: '{E6A6262A-CA08-4B3D-B030-E1A993B98452}',
          num: 3
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 4
        },
        {
          CLSID: '{CAAC1CFD-6745-416B-AFA4-CB57414856D0}',
          num: 5
        },
        {
          CLSID: '{6D21ECEA-F85B-4E8D-9D51-31DC9B8AA4EF}',
          num: 6
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 7
        },
        {
          CLSID: '{E6A6262A-CA08-4B3D-B030-E1A993B98453}',
          num: 8
        },
        {
          CLSID: '<CLEAN>',
          num: 10
        },
        {
          CLSID: '{C8E06185-7CD6-4C90-959F-044679E90751}',
          num: 10
        }
      ]
    },
    {
      task: 'DEAD',
      name: 'DEAD',
      displayName: 'DEAD',
      pylons: [
        {
          CLSID: '{C8E06185-7CD6-4C90-959F-044679E90751}',
          num: 1
        },
        {
          CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}',
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
          CLSID: '<CLEAN>',
          num: 10
        },
        {
          CLSID: '{6D21ECEA-F85B-4E8D-9D51-31DC9B8AA4EF}',
          num: 6
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 7
        },
        {
          CLSID: '{B06DD79A-F21E-4EB9-BD9D-AB3844618C93}',
          num: 8
        },
        {
          CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}',
          num: 9
        },
        {
          CLSID: '{C8E06185-7CD6-4C90-959F-044679E90751}',
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
          CLSID: '{C8E06185-7CD6-4C90-959F-044679E90751}',
          num: 1
        },
        {
          CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}',
          num: 2
        },
        {
          CLSID: '{DB769D48-67D7-42ED-A2BE-108D566C8B1E}',
          num: 3
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 4
        },
        {
          CLSID: '{CAAC1CFD-6745-416B-AFA4-CB57414856D0}',
          num: 5
        },
        {
          CLSID: '{6D21ECEA-F85B-4E8D-9D51-31DC9B8AA4EF}',
          num: 6
        },
        {
          CLSID: '{F376DBEE-4CAE-41BA-ADD9-B2910AC95DEC}',
          num: 7
        },
        {
          CLSID: '{DB769D48-67D7-42ED-A2BE-108D566C8B1E}',
          num: 8
        },
        {
          CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}',
          num: 9
        },
        {
          CLSID: '{C8E06185-7CD6-4C90-959F-044679E90751}',
          num: 10
        }
      ]
    }
  ]
}

export default aircraftDefinition
