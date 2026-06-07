import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export const UsaModern: z.infer<typeof schemas.template> = {
  name: 'USA - Modern',
  countryName: 'USA',
  era: 'Modern',
  groundUnitTypes: {
    SAM: ['Hawk'],
    Vehicle: ['M-2 Bradley', 'M-1 Abrams', 'M1126 Stryker ICV'],
    Infantry: ['Soldier M4'],
    'Shorad Vehicle': ['Vulcan', 'M6 Linebacker'],
    'Shorad Infantry': ['Soldier stinger'],
    EWS: ['FPS-117']
  }
}
