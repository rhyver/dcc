import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 60,
  display_name: 'VSN F-4B',
  flare: 30,
  max_fuel: 4864,
  max_height: 19000,
  max_speed: 2370,
  name: 'VSN_F4B',
  availableTasks: ['CAP', 'Fighter Sweep', 'Ground Attack', 'Pinpoint Strike', 'DEAD'],
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 251.80555555556,
  isHelicopter: false,
  era: 'Vietnam',
  carrierCapable: true,
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
