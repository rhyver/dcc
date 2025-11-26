import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 48,
  display_name: 'Tu-142',
  flare: 48,
  max_fuel: 87000,
  max_height: 13500,
  max_speed: 860,
  name: 'Tu-142',
  availableTasks: ['Antiship Strike'],
  controllable: false,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 220.97222222222,
  era: 'Early CW',
  carrierCapable: false,
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'default',
      pylons: [{ CLSID: '{C42EE4C3-355C-4B83-8B22-B39430B8F4AE}', num: 1 }]
    }
  ]
}

export default aircraftDefinition
