import { AircraftDefinition } from '../schemas'

const aircraftDefinition: AircraftDefinition = {
    chaff: 0,
    display_name: 'Ju 88',
    flare: 0,
    max_fuel: 2120,
    max_height: 11500,
    max_speed: 540,
    name: 'Ju-88A4',
    availableTasks: ['CAS', 'Ground Attack', 'Pinpoint Strike'],
    carrierCapable: false,
    controllable: false,
    cruiseAltitude: 6096,
    cruiseSpeed: 113,
    era: 'WW2',
    isHelicopter: false,
    loadouts: [
      {
        displayName: 'Default',
        name: 'default',
        task: 'default',
        pylons: [
          {
            CLSID: '{SC_500_L2}',
            num: 1
          },
          {
            CLSID: '{JU88A4TORP_10xSC50_on_InvCountedAttachmentPoints}',
            num: 2
          },
          {
            CLSID: '{SC_500_L2}',
            num: 3
          }
        ]
      }
    ]
  }

export default aircraftDefinition
