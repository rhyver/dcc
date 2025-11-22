import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
  chaff: 60,
  display_name: 'VSN F-4C',
  flare: 30,
  max_fuel: 4864,
  max_height: 19000,
  max_speed: 2370,
  name: 'VSN_F4C',
  availableTasks: ['CAP', 'Fighter Sweep', 'Ground Attack', 'Pinpoint Strike', 'DEAD'],
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 251.80555555556,
  isHelicopter: false,
  era: 'Early CW',
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

