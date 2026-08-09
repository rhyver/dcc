import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 120,
  display_name: 'CH-47F',
  flare: 120,
  max_fuel: 3054,
  max_height: 6750,
  max_speed: 300,
  name: 'CH-47Fbl1',
  availableTasks: ['CSAR', 'CASEVAC', 'Troop Extraction', 'Transport', 'Air Assault'],
  controllable: true,
  isHelicopter: true,
  cruiseAltitude: 150,
  cruiseSpeed: 46.25,
  era: 'Vietnam',
  carrierCapable: true,
  AddPropAircraft: {
    DustProtectionDevices: false,
    NetCrewControlPriority: 0
  },
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'default',
      pylons: []
    }
  ]
}

export default aircraftDefinition
