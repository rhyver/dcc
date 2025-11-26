import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 96,
  display_name: 'IL-76MD',
  flare: 96,
  max_fuel: 80000,
  max_height: 12000,
  max_speed: 850,
  name: 'IL-76MD',
  availableTasks: ['Transport'],
  controllable: false,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 220.97222222222,
  era: 'Late CW',
  carrierCapable: false,
  loadouts: []
}

export default aircraftDefinition
