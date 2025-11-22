import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 0,
    display_name: 'Mi-28N',
    flare: 128,
    max_fuel: 1500,
    max_height: 5300,
    max_speed: 305,
    name: 'Mi-28N',
    availableTasks: ['CAS'],
    controllable: false,
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
          { CLSID: '{57232979-8B0F-4db7-8D9A-55197E06B0F5}', num: 1 },
          { CLSID: '{6A4B9E69-64FE-439a-9163-3A87FB6A4D81}', num: 2 },
          { CLSID: '{6A4B9E69-64FE-439a-9163-3A87FB6A4D81}', num: 3 },
          { CLSID: '{57232979-8B0F-4db7-8D9A-55197E06B0F5}', num: 4 }
        ]
      }
    ]
  }

export default aircraftDefinition
