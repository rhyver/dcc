import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 30,
  display_name: 'UH-60A',
  flare: 30,
  max_fuel: 1100,
  max_height: 5800,
  max_speed: 300,
  name: 'UH-60A',
  availableTasks: ['CSAR', 'Transport', 'Air Assault'],
  controllable: false,
  isHelicopter: true,
  cruiseAltitude: 150,
  cruiseSpeed: 61.73333,
  era: 'Modern',
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
