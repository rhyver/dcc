import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 64,
  display_name: 'MiG-25PD',
  flare: 64,
  max_fuel: 15245,
  max_height: 20000,
  max_speed: 3000,
  name: 'MiG-25PD',
  availableTasks: ['CAP', 'Escort', 'Intercept'],
  controllable: false,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 251.80555555556,
  era: 'Late CW',
  carrierCapable: false,
  loadouts: [
    {
      task: 'default',
      name: 'Patrol, medium range',
      displayName: 'Patrol, medium range',
      pylons: [
        { CLSID: '{5F26DBC2-FB43-4153-92DE-6BBCE26CB0FF}', num: 1 },
        { CLSID: '{4EDBA993-2E34-444C-95FB-549300BF7CAF}', num: 2 },
        { CLSID: '{4EDBA993-2E34-444C-95FB-549300BF7CAF}', num: 3 },
        { CLSID: '{5F26DBC2-FB43-4153-92DE-6BBCE26CB0FF}', num: 4 }
      ]
    }
  ]
}

export default aircraftDefinition
