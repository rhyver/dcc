import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
  chaff: 210,
  display_name: 'AJS37',
  flare: 72,
  max_fuel: 4476,
  max_height: 21000,
  max_speed: 2203.2,
  name: 'AJS37',
  availableTasks: ['CAP', 'Fighter Sweep', 'Ground Attack', 'Pinpoint Strike', 'CAS', 'Intercept'],
  carrierCapable: false,
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 220.97222222222,
  era: 'Late CW',
  isHelicopter: false,
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
