import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 0,
    display_name: 'MiG-31',
    flare: 0,
    max_fuel: 15500,
    max_height: 20000,
    max_speed: 3000,
    name: 'MiG-31',
    availableTasks: ['CAP', 'Escort', 'Intercept', 'Fighter Sweep'],
    controllable: false,
    isHelicopter: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 251.80555555556,
    era: 'Late CW',
    carrierCapable: false,
    loadouts: [
      {
        task: 'default',
        name: 'default',
        displayName: 'default',
        pylons: [
          { CLSID: '{5F26DBC2-FB43-4153-92DE-6BBCE26CB0FF}', num: 1 },
          { CLSID: '{F1243568-8EF0-49D4-9CB5-4DA90D92BC1D}', num: 2 },
          { CLSID: '{F1243568-8EF0-49D4-9CB5-4DA90D92BC1D}', num: 3 },
          { CLSID: '{F1243568-8EF0-49D4-9CB5-4DA90D92BC1D}', num: 4 },
          { CLSID: '{F1243568-8EF0-49D4-9CB5-4DA90D92BC1D}', num: 5 },
          { CLSID: '{5F26DBC2-FB43-4153-92DE-6BBCE26CB0FF}', num: 6 }
        ]
      }
    ]
  }

export default aircraftDefinition
