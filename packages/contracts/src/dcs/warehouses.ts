import { z } from 'zod'

import { coalition } from './coalition'

const fuelItem = z.object({
  InitFuel: z.number()
})

export const warehouseState = z.object({
  allowHotStart: z.boolean().optional(),
  unlimitedMunitions: z.boolean().optional(),
  methanol_mixture: fuelItem.optional(),
  OperatingLevel_Air: z.number().optional(),
  diesel: fuelItem.optional(),
  speed: z.number().optional(),
  dynamicSpawn: z.boolean().optional(),
  unlimitedAircrafts: z.boolean().optional(),
  unlimitedFuel: z.boolean().optional(),
  jet_fuel: fuelItem.optional(),
  periodicity: z.number().optional(),
  suppliers: z.array(z.any()).optional(),
  coalition: coalition.optional().default('NEUTRAL'),
  dynamicCargo: z.boolean().optional(),
  OperatingLevel_Eqp: z.number().optional(),
  gasoline: fuelItem.optional(),
  aircrafts: z.any().optional(),
  weapons: z.any().optional(),
  OperatingLevel_Fuel: z.number().optional(),
  size: z.number().optional()
})

export const warehouses = z.object({
  airports: z.record(z.string(), warehouseState),
  warehouses: z.record(z.string(), warehouseState)
})
