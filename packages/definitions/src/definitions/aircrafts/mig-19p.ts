import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 0,
    display_name: 'MiG-19P',
    flare: 0,
    max_fuel: 1800,
    max_height: 17500,
    max_speed: 992,
    name: 'MiG-19P',
    availableTasks: ['CAP', 'Escort', 'Fighter Sweep', 'CAS', 'Pinpoint Strike'],
    carrierCapable: false,
    controllable: true,
    cruiseAltitude: 6096,
    cruiseSpeed: 220.97222222222,
    era: 'Korea',
    isHelicopter: false,
    allowedFrequency: [100, 140],
    loadouts: [
      {
        task: 'default',
        displayName: 'Default',
        name: 'Default',
        pylons: [
          {
            CLSID: '{K-13A}',
            num: 1
          },
          {
            CLSID: 'PTB760_MIG19',
            num: 2
          },
          {
            CLSID: '<CLEAN>',
            num: 3
          },
          {
            CLSID: '<CLEAN>',
            num: 4
          },
          {
            CLSID: 'PTB760_MIG19',
            num: 5
          },
          {
            CLSID: '{K-13A}',
            num: 6
          }
        ]
      },
      {
        task: 'CAS',
        displayName: 'CAS',
        name: 'CAS',
        pylons: [
          {
            CLSID: '<CLEAN>',
            num: 1
          },
          {
            CLSID: '{3C612111-C7AD-476E-8A8E-2485812F4E5C}',
            num: 2
          },
          {
            CLSID: '{ORO57K_S5M_HEFRAG}',
            num: 3
          },
          {
            CLSID: '{ORO57K_S5M_HEFRAG}',
            num: 4
          },
          {
            CLSID: '{3C612111-C7AD-476E-8A8E-2485812F4E5C}',
            num: 5
          }
        ]
      },
      {
        task: 'CAS',
        displayName: 'CAS',
        name: 'CAS',
        pylons: [
          {
            CLSID: '<CLEAN>',
            num: 1
          },
          {
            CLSID: '{3C612111-C7AD-476E-8A8E-2485812F4E5C}',
            num: 2
          },
          {
            CLSID: '{ORO57K_S5M_HEFRAG}',
            num: 3
          },
          {
            CLSID: '{ORO57K_S5M_HEFRAG}',
            num: 4
          },
          {
            CLSID: '{3C612111-C7AD-476E-8A8E-2485812F4E5C}',
            num: 5
          }
        ]
      }
    ]
  }

export default aircraftDefinition
