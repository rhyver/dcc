import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 30,
    display_name: 'AH-64D BLK.II',
    flare: 60,
    ammo_type: 1,
    gun: 25,
    max_fuel: 1140,
    max_speed: 365,
    name: 'AH-64D_BLK_II',
    max_height: 0,
    availableTasks: ['CAS', 'Ground Attack'],
    controllable: true,
    cruiseAltitude: 1000,
    cruiseSpeed: 46.25,
    isHelicopter: true,
    era: 'Late CW',
    carrierCapable: false,
    customCallsigns: [
      'Apache',
      'Crow',
      'Chaos',
      'Sioux',
      'Gatling',
      'Gunslinger',
      'Hammerhead',
      'Bootleg',
      'Palehorse',
      'Carnivore',
      'Saber'
    ],
    loadouts: [
      {
        task: 'default',
        name: 'default',
        displayName: 'default',
        pylons: [
          { CLSID: '{M261_OUTBOARD_AB_M151_E_M257}', num: 1 },
          { CLSID: '{88D18A5E-99C8-4B04-B40B-1C02F2018B6E}', num: 2 },
          { CLSID: '{88D18A5E-99C8-4B04-B40B-1C02F2018B6E}', num: 3 },
          { CLSID: '{M261_OUTBOARD_AB_M151_E_M257}', num: 4 },
          {
            CLSID: '{IAFS_ComboPak_100}',
            num: 5
          }
        ]
      }
    ]
  }

export default aircraftDefinition
