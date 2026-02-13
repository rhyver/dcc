import { z } from 'zod'

export const supplyStatus = z.enum([
  'abundant', // >75%
  'adequate', // 50-75%
  'low', // 25-50%
  'critical', // 5-25%
  'depleted' // 0-5%
])

export const supply = z.object({
  current: z.number().min(0), // Current supply points
  max: z.number().min(0), // Storage capacity
  consumptionRate: z.number().min(0), // Drain per tick
  productionRate: z.number().min(0), // Generation per tick
  status: supplyStatus
})

export type Supply = z.infer<typeof supply>
export type SupplyStatus = z.infer<typeof supplyStatus>
