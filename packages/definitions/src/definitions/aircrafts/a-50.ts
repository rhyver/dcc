import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 192,
    display_name: 'A-50',
    flare: 192,
    max_fuel: 70000,
    max_height: 12000,
    max_speed: 850,
    name: 'A-50',
    availableTasks: ['AWACS'],
    controllable: false,
    isHelicopter: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 220.97222222222,
    era: 'Korea',
    carrierCapable: false,
    isLarge: true,
    loadouts: [
      {
        task: 'default',
        name: 'default',
        displayName: 'default',
        pylons: []
      }
    ]
  }

export default aircraftDefinition
