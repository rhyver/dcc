import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
  chaff: 0,
  display_name: 'SA342M',
  flare: 32,
  max_fuel: 416.33,
  max_height: 6000,
  max_speed: 240,
  name: 'SA342M',
  availableTasks: ['CSAR', 'Ground Attack', 'Transport', 'Air Assault'],
  controllable: true,
  isHelicopter: true,
  cruiseAltitude: 150,
  cruiseSpeed: 46.25,
  era: 'Late CW',
  carrierCapable: false,
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'Default',
      pylons: []
    }
  ]
}

export default aircraftDefinition

