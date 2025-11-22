import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 64,
    display_name: 'Su-34',
    flare: 64,
    max_fuel: 9800,
    max_height: 15000,
    max_speed: 1900.008,
    name: 'Su-34',
    availableTasks: ['CAS', 'Ground Attack', 'Pinpoint Strike', 'SEAD', 'DEAD'],
    controllable: false,
    isHelicopter: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 220.97222222222,
    era: 'Modern',
    carrierCapable: false,
    loadouts: [
      {
        task: 'default',
        name: 'default',
        displayName: 'default',
        pylons: [
          { CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82F}', num: 1 },
          { CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}', num: 2 },
          { CLSID: '{X-29T}', num: 3 },
          { CLSID: '{BA565F89-2373-4A84-9502-A0E017D3A44A}', num: 4 },
          { CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}', num: 5 },
          { CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}', num: 6 },
          { CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}', num: 7 },
          { CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}', num: 8 },
          { CLSID: '{BA565F89-2373-4A84-9502-A0E017D3A44A}', num: 9 },
          { CLSID: '{X-29T}', num: 10 },
          { CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}', num: 11 },
          { CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82A}', num: 12 }
        ]
      },
      {
        task: 'DEAD',
        name: 'DEAD',
        displayName: 'DEAD',
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
            CLSID: '{2234F529-1D57-4496-8BB0-0150F9BDBBD2}',
            num: 3
          },
          {
            CLSID: '{2234F529-1D57-4496-8BB0-0150F9BDBBD2}',
            num: 4
          },
          {
            CLSID: '{4203753F-8198-4E85-9924-6F8FF679F9FF}',
            num: 5
          },
          {
            CLSID: '{E2C426E3-8B10-4E09-B733-9CDC26520F48}',
            num: 6
          },
          {
            CLSID: '{E2C426E3-8B10-4E09-B733-9CDC26520F48}',
            num: 7
          },
          {
            CLSID: '{4203753F-8198-4E85-9924-6F8FF679F9FF}',
            num: 8
          },
          {
            CLSID: '{2234F529-1D57-4496-8BB0-0150F9BDBBD2}',
            num: 9
          },
          {
            CLSID: '{2234F529-1D57-4496-8BB0-0150F9BDBBD2}',
            num: 10
          },
          {
            CLSID: '{B4C01D60-A8A3-4237-BD72-CA7655BC0FE9}',
            num: 11
          },
          {
            CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82A}',
            num: 12
          }
        ]
      }
    ]
  }

export default aircraftDefinition
