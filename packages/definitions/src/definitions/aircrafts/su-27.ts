import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 96,
    display_name: 'Su-27',
    flare: 96,
    max_fuel: 9400,
    max_height: 18500,
    max_speed: 2500,
    name: 'Su-27',
    availableTasks: ['CAP', 'Escort', 'Intercept', 'Fighter Sweep', 'Pinpoint Strike'],
    controllable: true,
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
          { CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82F}', num: 1 },
          { CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}', num: 2 },
          { CLSID: '{B79C379A-9E87-4E50-A1EE-7F7E29C2E87A}', num: 3 },
          { CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}', num: 4 },
          { CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}', num: 5 },
          { CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}', num: 6 },
          { CLSID: '{E8069896-8435-4B90-95C0-01A03AE6E400}', num: 7 },
          { CLSID: '{B79C379A-9E87-4E50-A1EE-7F7E29C2E87A}', num: 8 },
          { CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}', num: 9 },
          { CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82A}', num: 10 }
        ]
      },
      {
        task: 'Pinpoint Strike',
        name: 'Strike',
        displayName: 'Strike',
        pylons: [
          {
            CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82F}',
            num: 1
          },
          {
            CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}',
            num: 2
          },
          {
            CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}',
            num: 3
          },
          {
            CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}',
            num: 4
          },
          {
            CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}',
            num: 5
          },
          {
            CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}',
            num: 6
          },
          {
            CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}',
            num: 7
          },
          {
            CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}',
            num: 8
          },
          {
            CLSID: '{FBC29BFE-3D24-4C64-B81D-941239D12249}',
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
