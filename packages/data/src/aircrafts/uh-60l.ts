import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 30,
  display_name: 'UH-60L',
  flare: 30,
  max_fuel: 1100,
  max_height: 5800,
  max_speed: 300,
  name: 'UH-60L',
  availableTasks: ['CSAR', 'Transport', 'Air Assault'],
  controllable: true,
  isHelicopter: true,
  cruiseAltitude: 150,
  cruiseSpeed: 61.73333,
  era: 'Modern',
  carrierCapable: false,
  isMod: true,
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
