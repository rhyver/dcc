import * as z from 'zod'

import { task } from '../schemas'

export const pylon = z.object({
  CLSID: z.string(),
  num: z.number().optional()
})

export const launcherType = z.enum([
  'Weapon',
  'Fuel Tank',
  'Targeting Pod',
  'Gun Pod',
  'ECM Pod',
  'Other'
])

export const launcher = z.union([
  z.object({
    name: z.string(),
    displayName: z.string(),
    CLSID: z.string(),
    total: z.number(),
    type: z.literal('Weapon'),
    weapon: z.string()
  }),
  z.object({
    name: z.string(),
    displayName: z.string(),
    CLSID: z.string(),
    total: z.number(),
    type: launcherType.exclude(['Weapon'])
  })
])

export const loadout = z.object({
  task: z.union([task, z.literal('default')]),
  name: z.string(),
  displayName: z.string(),
  pylons: z.array(pylon)
})
