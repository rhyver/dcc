import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 120,
    display_name: 'E-2D',
    flare: 60,
    max_fuel: 5624,
    max_height: 9400,
    max_speed: 610,
    name: 'E-2C',
    availableTasks: ['AWACS'],
    controllable: false,
    isHelicopter: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 133.61111111111,
    era: 'Korea',
    carrierCapable: true,
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
