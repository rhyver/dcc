import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 48,
    display_name: 'Tu-95MS',
    flare: 48,
    max_fuel: 87000,
    max_height: 12000,
    max_speed: 830,
    name: 'Tu-95MS',
    availableTasks: [],
    controllable: false,
    isHelicopter: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 220.97222222222,
    era: 'Korea',
    carrierCapable: false,
    loadouts: [
      {
        task: 'default',
        name: 'default',
        displayName: 'default',
        pylons: [{ CLSID: '{0290F5DE-014A-4BB1-9843-D717749B1DED}', num: 1 }]
      }
    ]
  }

export default aircraftDefinition
