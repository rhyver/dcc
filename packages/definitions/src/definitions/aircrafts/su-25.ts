import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 128,
    display_name: 'Su-25',
    flare: 128,
    max_fuel: 2835,
    max_height: 7000,
    max_speed: 980,
    name: 'Su-25',
    availableTasks: ['CAS', 'Ground Attack', 'Pinpoint Strike'],
    controllable: true,
    isHelicopter: false,
    cruiseAltitude: 3048,
    cruiseSpeed: 174.72222222222,
    era: 'Early CW',
    carrierCapable: false,
    loadouts: [
      {
        task: 'default',
        displayName: 'RBK-250*4, S-8KOM*80, R-60M*2',
        name: 'RBK-250*4, S-8KOM*80, R-60M*2',
        pylons: [
          { CLSID: '{682A481F-0CB5-4693-A382-D00DD4A156D7}', num: 1 },
          { CLSID: '{F72F47E5-C83A-4B85-96ED-D3E46671EE9A}', num: 2 },
          { CLSID: '{F72F47E5-C83A-4B85-96ED-D3E46671EE9A}', num: 3 },
          { CLSID: '{4203753F-8198-4E85-9924-6F8FF679F9FF}', num: 4 },
          { CLSID: '{4203753F-8198-4E85-9924-6F8FF679F9FF}', num: 5 },
          { CLSID: '{4203753F-8198-4E85-9924-6F8FF679F9FF}', num: 6 },
          { CLSID: '{4203753F-8198-4E85-9924-6F8FF679F9FF}', num: 7 },
          { CLSID: '{F72F47E5-C83A-4B85-96ED-D3E46671EE9A}', num: 8 },
          { CLSID: '{F72F47E5-C83A-4B85-96ED-D3E46671EE9A}', num: 9 },
          { CLSID: '{682A481F-0CB5-4693-A382-D00DD4A156D7}', num: 10 }
        ]
      },
      {
        task: 'Pinpoint Strike',
        displayName: 'Strike',
        name: 'Strike',
        pylons: [
          {
            CLSID: '{682A481F-0CB5-4693-A382-D00DD4A156D7}',
            num: 1
          },
          {
            CLSID: '{0180F983-C14A-11d8-9897-000476191836}',
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
            CLSID: '{0180F983-C14A-11d8-9897-000476191836}',
            num: 9
          },
          {
            CLSID: '{682A481F-0CB5-4693-A382-D00DD4A156D7}',
            num: 10
          }
        ]
      }
    ]
  }

export default aircraftDefinition
