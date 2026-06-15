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
  'Air Assault',
  'SEAD',
  'Intercept',
  'Antiship Strike',
  'AWACS',
  'Intercept',
  'Fighter Sweep',
  'Ground Attack',
  'Runway Attack',
  'Transport',
  'Refueling',
  'RescueHelo',
  'CSAR',
  'AFAC'
])
