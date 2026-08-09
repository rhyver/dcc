import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export const UkFalklands: z.infer<typeof schemas.template> = {
  name: 'UK - Falklands 1982',
  countryName: 'UK',
  era: 'Late CW',
  groundUnitTypes: {
    SAM: ['Hawk'],
    Vehicle: ['M-113'],
    Infantry: ['Soldier M4'],
    'Shorad Vehicle': ['Vulcan'],
    'Shorad Infantry': ['Soldier stinger'],
    EWS: ['FPS-117']
  }
}
