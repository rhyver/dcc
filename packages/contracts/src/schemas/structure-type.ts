import * as z from 'zod'

export const structureType = z.enum([
  'Ammo Depot',
  'Farp',
  'Command Center',
  'Factory',
  'Factory 2',
  'Logistics Hub',
  'Power Plant',
  'Fuel Storage',
  'Hospital',
  'Prison',
  'Barrack',
  'Depot'
])
