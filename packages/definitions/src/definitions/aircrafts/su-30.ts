import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 96,
    display_name: 'Su-30',
    flare: 96,
    max_fuel: 9400,
    max_height: 17300,
    max_speed: 2200,
    name: 'Su-30',
    availableTasks: ['CAP', 'Escort', 'Intercept', 'Fighter Sweep'],
    controllable: false,
    isHelicopter: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 251.80555555556,
    era: 'Modern',
    carrierCapable: false,
    loadouts: [
      {
        task: 'default',
        name: 'default',
        displayName: 'default',
        pylons: [
          {
            CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82F}',
            num: 1
          },
          {
            CLSID: '{B4C01D60-A8A3-4237-BD72-CA7655BC0FE9}',
            num: 2
          },
          {
            CLSID: '{B79C379A-9E87-4E50-A1EE-7F7E29C2E87A}',
            num: 3
          },
          {
            CLSID: '{B4C01D60-A8A3-4237-BD72-CA7655BC0FE9}',
            num: 4
          },
          {
            CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}',
            num: 5
          },
          {
            CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}',
            num: 6
          },
          {
            CLSID: '{B4C01D60-A8A3-4237-BD72-CA7655BC0FE9}',
            num: 7
          },
          {
            CLSID: '{B79C379A-9E87-4E50-A1EE-7F7E29C2E87A}',
            num: 8
          },
          {
            CLSID: '{B4C01D60-A8A3-4237-BD72-CA7655BC0FE9}',
            num: 9
          },
          {
            CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82A}',
            num: 10
          }
        ]
      }
    ]
  }

export default aircraftDefinition
