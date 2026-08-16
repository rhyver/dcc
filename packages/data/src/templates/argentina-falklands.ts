import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export const ArgentinaFalklands: z.infer<typeof schemas.template> = {
  name: 'Argentina - Falklands 1982',
  countryName: 'Argentina',
  era: 'Late CW',
  groundUnitTypes: {
    SAM: ['Hawk', 'Roland'],
    Vehicle: ['M-113'],
    Infantry: ['Infantry AK'],
    'Shorad Vehicle': ['ZSU-23-4 Shilka', 'Ural-375 ZU-23'],
    'Shorad Infantry': ['SA-18 Igla-S manpad'],
    EWS: ['FPS-117']
  }
}
