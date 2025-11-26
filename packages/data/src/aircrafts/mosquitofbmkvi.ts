import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 0,
  display_name: 'Mosquito FB Mk. VI',
  flare: 0,
  max_fuel: 1483.1,
  max_height: 11500,
  max_speed: 648,
  name: 'MosquitoFBMkVI',
  availableTasks: ['CAS', 'Ground Attack', 'Pinpoint Strike'],
  carrierCapable: false,
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 174.72222222222,
  era: 'WW2',
  isHelicopter: false,
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'Default',
      pylons: []
    }
  ]
}

export default aircraftDefinition
