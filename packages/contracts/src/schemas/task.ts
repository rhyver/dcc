import * as z from 'zod'

export const task = z.enum([
  'DEAD',
  'AWACS',
  'CAP',
  'Escort',
  'Pinpoint Strike',
  'Strategic Strike',
  'CAS',
  'CSAR',
  'CASEVAC',
  'Troop Extraction',
  'Air Assault',
  'SEAD',
  'Intercept',
  'Antiship Strike',
  'Fighter Sweep',
  'Ground Attack',
  'Runway Attack',
  'Transport',
  'Refueling',
  'RescueHelo',
  'AFAC'
])
