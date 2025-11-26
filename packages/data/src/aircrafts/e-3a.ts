import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 120,
  display_name: 'E-3A',
  flare: 60,
  max_fuel: 65000,
  max_height: 13100,
  max_speed: 860,
  name: 'E-3A',
  availableTasks: ['AWACS'],
  controllable: false,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 220.97222222222,
  era: 'Korea',
  carrierCapable: false,
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
