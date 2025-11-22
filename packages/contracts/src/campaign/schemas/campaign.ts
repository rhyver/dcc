import * as z from 'zod'

import { coalition } from '../../schemas/coalition'
import { groundUnitType } from '../../schemas/ground-unit-type'
import { task } from '../../schemas/task'

const campaignStructure = z.object({
  id: z.string(),
  type: z.string(),
  objectiveId: z.string()
})

const campaignCoalition = z.object({
  id: z.string(),
  aircraftTypes: z.record(task, z.array(z.string())),
  groundUnitTypes: z.record(groundUnitType, z.array(z.string())),
  airdromeNames: z.array(z.string()),
  objectiveIds: z.array(z.string()),
  structures: z.array(campaignStructure)
})

export const campaign = z.object({
  version: z.string(),
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  time: z.date(),
  timeMultiplier: z.number(),
  scenarioId: z.string(),
  coalitions: z.record(coalition, campaignCoalition)
})
