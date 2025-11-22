import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 120,
    display_name: 'C-17A',
    flare: 60,
    max_fuel: 132405,
    max_height: 13700,
    max_speed: 850,
    name: 'C-17A',
    availableTasks: ['Transport'],
    carrierCapable: false,
    controllable: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 133.61111111111,
    era: 'Modern',
    isHelicopter: false,
    loadouts: [
      {
        task: 'default',
        displayName: 'default',
        name: 'default',
        pylons: []
      }
    ]
  }

export default aircraftDefinition
