import { z } from 'zod'
import { aircraftType } from './aircraft-type'
import { era } from './era'
import { task } from './task'
import { launcherType } from './launcher-type'

export const pylon = z.object({
  CLSID: z.string(),
  num: z.number().optional()
})

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

export const aircraftDefinition = z.object({
  chaff: z.number(),
  display_name: z.string(),
  flare: z.number(),
  ammo_type: z.number().optional(),
  gun: z.number().optional(),
  max_fuel: z.number(),
  max_height: z.number(),
  max_speed: z.number(),
  name: aircraftType,
  loadouts: z.array(loadout),
  availableTasks: z.array(task),
  controllable: z.boolean(),
  maxWaypoints: z.number().optional(),
  isHelicopter: z.boolean().default(false).optional(),
  isMod: z.boolean().default(false).optional(),
  isLarge: z.boolean().default(false).optional(),
  cruiseAltitude: z.number(),
  cruiseSpeed: z.number(),
  era,
  carrierCapable: z.boolean(),
  allowedFrequency: z.tuple([z.number(), z.number()]).optional(),
  customCallsigns: z.array(z.string()).optional(),
  AddPropAircraft: z.record(z.string(), z.string().or(z.number()).or(z.boolean())).optional(),
  datalinks: z
    .object({
      Link16: z.object({
        settings: z.record(z.string(), z.string().or(z.number()).or(z.boolean()))
      })
    })
    .optional()
})
export type AircraftDefinition = z.TypeOf<typeof aircraftDefinition>
