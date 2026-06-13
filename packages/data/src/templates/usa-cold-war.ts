import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export const UsaColdWar: z.infer<typeof schemas.template> = {
  name: 'USA - Cold War',
  countryName: 'USA',
  era: 'Early CW',
  groundUnitTypes: {
    SAM: ['Hawk'],
    Vehicle: ['M-113', 'M-60'],
    Infantry: ['Soldier M4'],
    'Shorad Vehicle': ['M1_37mm', 'Vulcan'],
    'Shorad Infantry': ['M45_Quadmount'],
    EWS: ['FPS-117']
  }
}
