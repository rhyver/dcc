import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 120,
  display_name: 'CH-47D',
  flare: 120,
  max_fuel: 3600,
  max_height: 6750,
  max_speed: 300,
  name: 'CH-47D',
  availableTasks: ['CSAR', 'Transport', 'Air Assault'],
  controllable: false,
  isHelicopter: true,
  cruiseAltitude: 150,
  cruiseSpeed: 46.25,
  era: 'Vietnam',
  carrierCapable: false,
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
