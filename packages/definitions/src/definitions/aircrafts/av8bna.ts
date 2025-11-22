import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
  chaff: 60,
  display_name: 'AV-8B N/A',
  flare: 120,
  max_fuel: 3519.423,
  max_height: 13716,
  max_speed: 990,
  name: 'AV8BNA',
  availableTasks: ['CAS', 'Ground Attack', 'Pinpoint Strike', 'CAP', 'DEAD'],
  carrierCapable: true,
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 174.72222222222,
  era: 'Modern',
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

