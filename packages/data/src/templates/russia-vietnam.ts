import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export const RussiaVietnamTemplate: z.infer<typeof schemas.template> = {
  name: 'Russia - Vietnam',
  countryName: 'Russia',
  era: 'Vietnam',
  groundUnitTypes: {
    SAM: ['SA-2', 'SA-5'],
    Infantry: ['Infantry AK'],
    Vehicle: ['BMP-1', 'MTLB', 'T-55'],
    'Shorad Vehicle': ['ZSU-23-4 Shilka', 'ZSU_57_2'],
    'Shorad Infantry': ['Ural-375 ZU-23'],
    EWS: ['1L13 EWR']
  }
}
