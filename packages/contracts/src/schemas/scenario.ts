import * as z from 'zod'

import { coalition } from './coalition'
import { era } from './era'

const startObjectives = z.object({
  airdromeNames: z.array(z.string()),
  carrierObjectiveId: z.string().optional(),
  objectiveIds: z.array(z.string())
})

export const scenario = z.object({
  theatreName: z.string(),
  id: z.string(),
  available: z.boolean(),
  name: z.string(),
  era,
  date: z.date(),
  briefing: z.string(),
  start: z.record(coalition, startObjectives)
})
