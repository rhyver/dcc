import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 220,
  display_name: 'C-130J-30',
  flare: 200,
  max_fuel: 15753.6,
  max_height: 10000,
  max_speed: 610,
  name: 'C-130J-30',
  availableTasks: ['Transport'],
  carrierCapable: false,
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 174.72222222222,
  era: 'Vietnam',
  isHelicopter: false,
  AddPropAircraft: {
    NetCrewControlPriority: 0,
    allow_air_load: false,
    cargo_7: '',
    cargo_1: '',
    cargo_10: '',
    cargo_8: '',
    pre_flight_complete: false,
    cargo_9: '',
    cargo_4: '',
    cargo_6: '',
    cargo_2: '',
    cargo_5: '',
    ramp_down: false,
    cargo_3: '',
    save_custom_data: true,
    allow_moab: false
  },
  loadouts: [
    {
      task: 'default',
      displayName: 'default',
      name: 'default',
      pylons: []
    }
  ]
}

export default aircraftDefinition
