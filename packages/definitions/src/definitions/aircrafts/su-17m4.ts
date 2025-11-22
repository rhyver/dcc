import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 64,
    display_name: 'Su-17M4',
    flare: 64,
    max_fuel: 3770,
    max_height: 14000,
    max_speed: 1860,
    name: 'Su-17M4',
    availableTasks: ['CAS', 'Ground Attack', 'Pinpoint Strike', 'DEAD'],
    controllable: false,
    isHelicopter: false,
    cruiseAltitude: 3048,
    cruiseSpeed: 174.72222222222,
    era: 'Early CW',
    carrierCapable: false,
    loadouts: [
      {
        task: 'default',
        displayName: 'default',
        name: 'default',
        pylons: [
          { CLSID: '{F72F47E5-C83A-4B85-96ED-D3E46671EE9A}', num: 1 },
          { CLSID: '{APU-60-1_R_60M}', num: 2 },
          { CLSID: '{F72F47E5-C83A-4B85-96ED-D3E46671EE9A}', num: 3 },
          { CLSID: '{E659C4BE-2CD8-4472-8C08-3F28ACB61A8A}', num: 4 },
          { CLSID: '{E659C4BE-2CD8-4472-8C08-3F28ACB61A8A}', num: 5 },
          { CLSID: '{F72F47E5-C83A-4B85-96ED-D3E46671EE9A}', num: 6 },
          { CLSID: '{APU-60-1_R_60M}', num: 7 },
          { CLSID: '{F72F47E5-C83A-4B85-96ED-D3E46671EE9A}', num: 8 }
        ]
      },
      {
        task: 'Pinpoint Strike',
        displayName: 'Pinpoint Strike',
        name: 'Pinpoint Strike',
        pylons: [
          { CLSID: '{E659C4BE-2CD8-4472-8C08-3F28ACB61A8A}', num: 1 },
          { CLSID: '{APU-60-1_R_60M}', num: 2 },
          { CLSID: '{3E35F8C1-052D-11d6-9191-00A0249B6F00}', num: 3 },
          { CLSID: '{E659C4BE-2CD8-4472-8C08-3F28ACB61A8A}', num: 4 },
          { CLSID: '{E659C4BE-2CD8-4472-8C08-3F28ACB61A8A}', num: 5 },
          { CLSID: '{3E35F8C1-052D-11d6-9191-00A0249B6F00}', num: 6 },
          { CLSID: '{APU-60-1_R_60M}', num: 7 },
          { CLSID: '{E659C4BE-2CD8-4472-8C08-3F28ACB61A8A}', num: 8 }
        ]
      }
    ]
  }

export default aircraftDefinition
