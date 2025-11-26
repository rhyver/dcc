import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 1125,
  display_name: 'B-52H',
  flare: 192,
  max_fuel: 141135,
  max_height: 17000,
  max_speed: 1000,
  name: 'B-52H',
  availableTasks: [],
  controllable: false,
  cruiseAltitude: 9144,
  cruiseSpeed: 220.97222222222,
  isHelicopter: false,
  isLarge: true,
  era: 'Early CW',
  carrierCapable: false,
  loadouts: [
    {
      task: 'default',
      name: 'Bombs',
      displayName: 'Bombs',
      pylons: [
        {
          CLSID: '{585D626E-7F42-4073-AB70-41E728C333E2}',
          num: 1
        },
        {
          CLSID: '{6C47D097-83FF-4FB2-9496-EAB36DDF0B05}',
          num: 2
        },
        {
          CLSID: '{585D626E-7F42-4073-AB70-41E728C333E2}',
          num: 3
        }
      ]
    }
  ]
}

export default aircraftDefinition
