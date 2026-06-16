import { z } from 'zod'

export const supplyStatus = z.enum([
  'abundant', // >75%
  'adequate', // 50-75%
  'low', // 25-50%
  'critical', // 5-25%
  'depleted' // 0-5%
])

export const supplyPool = z.object({
  current: z.number().min(0),
  max: z.number().min(0),
  productionRate: z.number().min(0).default(0),
  consumptionRate: z.number().min(0).default(0)
})

export const logisticsRoute = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  capacity: z.number().min(0),
  disruption: z.number().min(0).max(1).default(0),
  interdictedUntil: z.date().optional(),
  repairProgress: z.number().min(0).max(1).default(1)
})

export const virtualLogistics = z.object({
  hub: z.boolean().optional(),
  hubLevel: z.number().min(0).default(1),
  routeCapacity: z.number().min(0).optional(),
  routes: z.array(logisticsRoute).default([]),
  interdiction: z.number().min(0).max(1).default(0),
  repairRate: z.number().min(0).default(0),
  recoveryUntil: z.date().optional()
})

export const supply = z.object({
  current: z.number().min(0), // Current supply points
  max: z.number().min(0), // Storage capacity
  consumptionRate: z.number().min(0), // Drain per tick
  productionRate: z.number().min(0), // Generation per tick
  status: supplyStatus,
  fuel: supplyPool.optional(),
  munitions: supplyPool.optional(),
  repair: supplyPool.optional(),
  logistics: virtualLogistics.optional()
})

export type Supply = z.infer<typeof supply>
export type SupplyStatus = z.infer<typeof supplyStatus>
export type SupplyPool = z.infer<typeof supplyPool>
export type LogisticsRoute = z.infer<typeof logisticsRoute>
export type VirtualLogistics = z.infer<typeof virtualLogistics>
