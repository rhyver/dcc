import * as z from 'zod'

import { coalition } from './coalition'
import { era } from './era'
import { navalGroup } from './naval-group'

const startObjectives = z.object({
  airdromeNames: z.array(z.string()),
  carrierObjectiveId: z.string().optional(),
  groundGroupSpawnMultiplier: z.number().positive().optional(),
  objectiveIds: z.array(z.string())
})

const scenarioGoal = z.object({
  coalition,
  objectiveIds: z.array(z.string()).min(1)
})

export const scenario = z.object({
  theatreName: z.string(),
  id: z.string(),
  available: z.boolean(),
  name: z.string(),
  author: z.string().optional(),
  era,
  date: z.date(),
  briefing: z.string(),
  navalGroups: z.record(coalition, z.array(navalGroup)).optional(),
  deferredObjectiveIds: z.array(z.string()).optional(),
  goal: scenarioGoal.optional(),
  start: z.record(coalition, startObjectives)
})
