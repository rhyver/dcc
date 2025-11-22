import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
  chaff: 0,
  display_name: 'F-117A',
  flare: 0,
  max_fuel: 8255,
  max_height: 13700,
  max_speed: 1000,
  name: 'F-117A',
  availableTasks: ['Pinpoint Strike'],
  carrierCapable: false,
  controllable: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 251.80555555556,
  era: 'Modern',
  isHelicopter: false,
  loadouts: [
    {
      task: 'default',
      displayName: 'default',
      name: 'default',
      pylons: [
        { CLSID: '{51F9AAE5-964F-4D21-83FB-502E3BFE5F8A}', num: 1 },
        { CLSID: '{51F9AAE5-964F-4D21-83FB-502E3BFE5F8A}', num: 2 }
      ]
    }
  ]
}

export default aircraftDefinition
