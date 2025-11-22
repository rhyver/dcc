import * as z from 'zod'

export const structureType = z.enum([
  'Ammo Depot',
  'Farp',
  'Command Center',
  'Power Plant',
  'Fuel Storage',
  'Hospital',
  'Prison',
  'Barrack',
  'Depot'
])
