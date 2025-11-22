import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 120,
    display_name: 'C-130',
    flare: 60,
    max_fuel: 20830,
    max_height: 10000,
    max_speed: 610,
    name: 'C-130',
    availableTasks: ['Transport'],
    carrierCapable: false,
    controllable: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 174.72222222222,
    era: 'Korea',
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
