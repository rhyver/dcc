import * as z from 'zod'

export const groundUnitType = z.enum([
  'SAM',
  'Vehicle',
  'Infantry',
  'Shorad Vehicle',
  'Shorad Infantry',
  'EWS'
])
