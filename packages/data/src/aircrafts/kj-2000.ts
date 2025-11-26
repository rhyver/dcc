import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 0,
  display_name: 'KJ-2000',
  flare: 0,
  max_fuel: 70000,
  max_height: 12247,
  max_speed: 849.996,
  name: 'KJ-2000',
  availableTasks: ['AWACS'],
  carrierCapable: false,
  controllable: false,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 220.97222222222,
  era: 'Korea',
  isLarge: true,
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
