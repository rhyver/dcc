import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export const RussiaKoreaWar: z.infer<typeof schemas.template> = {
  name: 'Russia - Korea War',
  countryName: 'Russia',
  era: 'Early CW',
  groundUnitTypes: {
    SAM: [],
    Infantry: ['Infantry AK'],
    Vehicle: ['BMP-1', 'MTLB', 'T-55', 'PT_76'],
    'Shorad Vehicle': ['ZSU_57_2'],
    'Shorad Infantry': ['Ural-375 ZU-23'],
    EWS: ['1L13 EWR']
  }
}
