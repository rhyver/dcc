import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 30,
    display_name: 'MiG-29S',
    flare: 30,
    max_fuel: 3493,
    max_height: 18000,
    max_speed: 2450,
    name: 'MiG-29S',
    availableTasks: ['CAP', 'Escort', 'Intercept', 'Fighter Sweep'],
    controllable: true,
    isHelicopter: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 220.97222222222,
    era: 'Late CW',
    carrierCapable: false,
    loadouts: [
      {
        task: 'default',
        name: 'default',
        displayName: 'default',
        pylons: [
          { CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}', num: 1 },
          { CLSID: '{B4C01D60-A8A3-4237-BD72-CA7655BC0FE9}', num: 2 },
          { CLSID: '{B4C01D60-A8A3-4237-BD72-CA7655BC0FE9}', num: 3 },
          { CLSID: '{2BEC576B-CDF5-4B7F-961F-B0FA4312B841}', num: 4 },
          { CLSID: '{B4C01D60-A8A3-4237-BD72-CA7655BC0FE9}', num: 5 },
          { CLSID: '{B4C01D60-A8A3-4237-BD72-CA7655BC0FE9}', num: 6 },
          { CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}', num: 7 }
        ]
      }
    ]
  }

export default aircraftDefinition
