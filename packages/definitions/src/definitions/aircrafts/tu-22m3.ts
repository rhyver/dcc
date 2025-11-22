import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 48,
    display_name: 'Tu-22M3',
    flare: 48,
    max_fuel: 50000,
    max_height: 13300,
    max_speed: 2300,
    name: 'Tu-22M3',
    availableTasks: ['Antiship Strike'],
    controllable: false,
    isHelicopter: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 251.80555555556,
    era: 'Modern',
    carrierCapable: false,
    loadouts: [
      {
        task: 'default',
        name: 'default',
        displayName: 'default',
        pylons: [
          { CLSID: '{12429ECF-03F0-4DF6-BCBD-5D38B6343DE1}', num: 1 },
          { CLSID: '<CLEAN>', num: 2 },
          { CLSID: '<CLEAN>', num: 3 },
          { CLSID: '<CLEAN>', num: 4 },
          { CLSID: '{12429ECF-03F0-4DF6-BCBD-5D38B6343DE1}', num: 5 }
        ]
      }
    ]
  }

export default aircraftDefinition
