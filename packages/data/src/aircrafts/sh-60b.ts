import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 30,
  display_name: 'SH-60B',
  flare: 30,
  max_fuel: 1100,
  max_height: 5800,
  max_speed: 240,
  name: 'SH-60B',
  availableTasks: ['Transport', 'CSAR', 'Air Assault'],
  controllable: false,
  isHelicopter: true,
  cruiseAltitude: 150,
  cruiseSpeed: 46.25,
  era: 'Modern',
  carrierCapable: true,
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
