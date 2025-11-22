import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 18,
    display_name: 'MiG-21Bis',
    flare: 40,
    max_fuel: 2280,
    max_height: 20000,
    max_speed: 2509.2,
    name: 'MiG-21Bis',
    availableTasks: ['CAP', 'Escort', 'Intercept', 'CAS', 'Pinpoint Strike'],
    controllable: true,
    isHelicopter: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 220.97222222222,
    era: 'Early CW',
    carrierCapable: false,
    allowedFrequency: [118, 140],
    loadouts: [
      {
        task: 'default',
        name: 'Patrol, medium range',
        displayName: 'Patrol, medium range',
        pylons: [
          {
            CLSID: '{R-60 2L}',
            num: 1
          },
          {
            CLSID: '{R-3R}',
            num: 2
          },
          {
            CLSID: '{PTB_800_MIG21}',
            num: 3
          },
          {
            CLSID: '{R-3R}',
            num: 4
          },
          {
            CLSID: '{R-60 2R}',
            num: 5
          },
          {
            CLSID: '{ASO-2}',
            num: 6
          }
        ]
      },
      {
        task: 'CAS',
        name: 'CAS',
        displayName: 'CAS',
        pylons: [
          {
            CLSID: '{UB-16_S5M}',
            num: 1
          },
          {
            CLSID: '{08164777-5E9C-4B08-B48E-5AA7AFB246E2}',
            num: 2
          },
          {
            CLSID: '{PTB_800_MIG21}',
            num: 3
          },
          {
            CLSID: '{08164777-5E9C-4B08-B48E-5AA7AFB246E2}',
            num: 4
          },
          {
            CLSID: '{UB-16_S5M}',
            num: 5
          },
          {
            CLSID: '{ASO-2}',
            num: 6
          }
        ]
      },
      {
        task: 'Pinpoint Strike',
        name: 'Strike',
        displayName: 'Strike',
        pylons: [
          {
            CLSID: '{3C612111-C7AD-476E-8A8E-2485812F4E5C}',
            num: 1
          },
          {
            CLSID: '{3C612111-C7AD-476E-8A8E-2485812F4E5C}',
            num: 2
          },
          {
            CLSID: '{PTB_800_MIG21}',
            num: 3
          },
          {
            CLSID: '{3C612111-C7AD-476E-8A8E-2485812F4E5C}',
            num: 4
          },
          {
            CLSID: '{3C612111-C7AD-476E-8A8E-2485812F4E5C}',
            num: 5
          },
          {
            CLSID: '{ASO-2}',
            num: 6
          }
        ]
      }
    ]
  }

export default aircraftDefinition
