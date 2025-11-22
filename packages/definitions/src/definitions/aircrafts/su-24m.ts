import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 96,
    display_name: 'Su-24M',
    flare: 96,
    max_fuel: 11700,
    max_height: 16500,
    max_speed: 1700,
    name: 'Su-24M',
    availableTasks: ['CAS', 'Ground Attack', 'Pinpoint Strike'],
    controllable: false,
    isHelicopter: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 220.97222222222,
    era: 'Early CW',
    carrierCapable: false,
    loadouts: [
      {
        task: 'CAS',
        name: 'CAS',
        displayName: 'CAS',
        pylons: [
          { CLSID: '{E86C5AA5-6D49-4F00-AD2E-79A62D6DDE26}', num: 1 },
          { CLSID: '{E86C5AA5-6D49-4F00-AD2E-79A62D6DDE26}', num: 2 },
          { CLSID: '{F99BEC1A-869D-4AC7-9730-FBA0E3B1F5FC}', num: 3 },
          { CLSID: '<CLEAN>', num: 4 },
          { CLSID: '{16602053-4A12-40A2-B214-AB60D481B20E}', num: 5 },
          { CLSID: '{F99BEC1A-869D-4AC7-9730-FBA0E3B1F5FC}', num: 6 },
          { CLSID: '{E86C5AA5-6D49-4F00-AD2E-79A62D6DDE26}', num: 7 },
          { CLSID: '{E86C5AA5-6D49-4F00-AD2E-79A62D6DDE26}', num: 8 }
        ]
      },
      {
        task: 'DEAD',
        name: 'DEAD',
        displayName: 'DEAD',
        pylons: [
          {
            CLSID: '{APU-60-1_R_60M}',
            num: 1
          },
          {
            CLSID: '{4D13E282-DF46-4B23-864A-A9423DFDE504}',
            num: 2
          },
          {
            CLSID: '{7AEC222D-C523-425e-B714-719C0D1EB14D}',
            num: 3
          },
          { CLSID: '<CLEAN>', num: 4 },
          {
            CLSID: '{0519A264-0AB6-11d6-9193-00A0249B6F00}',
            num: 5
          },
          {
            CLSID: '{7AEC222D-C523-425e-B714-719C0D1EB14D}',
            num: 6
          },
          {
            CLSID: '{D8F2C90B-887B-4B9E-9FE2-996BC9E9AF03}',
            num: 7
          },
          {
            CLSID: '{APU-60-1_R_60M}',
            num: 8
          }
        ]
      },
      {
        task: 'default',
        name: 'default',
        displayName: 'default',
        pylons: [
          { CLSID: '{APU-60-1_R_60M}', num: 1 },
          { CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}', num: 2 },
          { CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}', num: 3 },
          { CLSID: '<CLEAN>', num: 4 },
          { CLSID: '{16602053-4A12-40A2-B214-AB60D481B20E}', num: 5 },
          { CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}', num: 6 },
          { CLSID: '{37DCC01E-9E02-432F-B61D-10C166CA2798}', num: 7 },
          { CLSID: '{APU-60-1_R_60M}', num: 8 }
        ]
      }
    ]
  }

export default aircraftDefinition
