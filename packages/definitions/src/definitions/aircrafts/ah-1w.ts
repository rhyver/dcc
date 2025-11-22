import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 30,
    display_name: 'AH-1W Super Cobra',
    flare: 30,
    max_fuel: 1250,
    max_height: 5500,
    max_speed: 290,
    name: 'AH-1W',
    availableTasks: ['CAS', 'Ground Attack'],
    controllable: false,
    isHelicopter: true,
    cruiseAltitude: 150,
    cruiseSpeed: 61.73333,
    era: 'Late CW',
    carrierCapable: false,
    isMod: true,
    loadouts: [
      {
        task: 'default',
        name: 'default',
        displayName: 'default',
        pylons: [
          { CLSID: '{3EA17AB0-A805-4D9E-8732-4CE00CB00F17}', num: 1 },
          { CLSID: 'M260_HYDRA', num: 2 },
          { CLSID: 'M260_HYDRA', num: 3 },
          { CLSID: '{3EA17AB0-A805-4D9E-8732-4CE00CB00F17}', num: 4 }
        ]
      }
    ]
  }

export default aircraftDefinition
