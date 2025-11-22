import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 0,
    display_name: 'Ka-50',
    flare: 128,
    max_fuel: 1450,
    max_speed: 350,
    name: 'Ka-50',
    max_height: 0,
    availableTasks: ['CAS'],
    controllable: true,
    cruiseAltitude: 1000,
    cruiseSpeed: 46.25,
    isHelicopter: true,
    era: 'Modern',
    carrierCapable: false,
    loadouts: [
      {
        task: 'default',
        name: 'default',
        displayName: 'default',
        pylons: [
          { CLSID: '{A6FD14D3-6D30-4C85-88A7-8D17BEE120E2}', num: 1 },
          { CLSID: '{6A4B9E69-64FE-439a-9163-3A87FB6A4D81}', num: 2 },
          { CLSID: '{6A4B9E69-64FE-439a-9163-3A87FB6A4D81}', num: 3 },
          { CLSID: '{A6FD14D3-6D30-4C85-88A7-8D17BEE120E2}', num: 4 }
        ]
      }
    ]
  }

export default aircraftDefinition
