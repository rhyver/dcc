import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 60,
    display_name: 'CH-53E',
    flare: 60,
    max_fuel: 2880,
    max_height: 6200,
    max_speed: 310,
    name: 'CH-53E',
    availableTasks: ['CSAR', 'Transport', 'Air Assault'],
    controllable: false,
    isHelicopter: true,
    cruiseAltitude: 150,
    cruiseSpeed: 46.25,
    era: 'Late CW',
    carrierCapable: true,
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
