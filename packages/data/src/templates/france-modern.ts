import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export const FranceModern: z.infer<typeof schemas.template> = {
  name: 'France - Modern',
  countryName: 'France',
  era: 'Modern',
  groundUnitTypes: {
    SAM: ['Hawk'],
    Vehicle: ['LAV-25', 'Leclerc'],
    Infantry: ['Soldier M4'],
    'Shorad Vehicle': ['Roland ADS', 'Gepard'],
    'Shorad Infantry': ['Soldier stinger'],
    EWS: ['FPS-117']
  }
}
