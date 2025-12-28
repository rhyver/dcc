import * as z from 'zod'

import { flightGroup } from '../../schemas'
import { coalition } from '../../schemas/coalition'
import { groundUnitType } from '../../schemas/ground-unit-type'
import { position } from '../../schemas/position'
import { samType } from '../../schemas/sam'
import { structureBuilding } from '../../schemas/structure-building'
import { task } from '../../schemas/task'

const campaignStructure = z.object({
  id: z.string(),
  type: z.string(),
  objectiveId: z.string(),
  position,
  name: z.string(),
  buildings: z.array(structureBuilding)
})

const campaignSamGroup = z.object({
  id: z.string(),
  type: samType,
  objectiveId: z.string()
})

const campaignGroundGroup = z.object({
  id: z.string(),
  objectiveId: z.string(),
  units: z.array(
    z.object({
      name: z.string(),
      count: z.number()
    })
  )
})

const campaignCoalition = z.object({
  id: z.string(),
  aircraftTypes: z.record(task, z.array(z.string())),
  groundUnitTypes: z.record(groundUnitType, z.array(z.string())),
  airdromeNames: z.array(z.string()),
  objectiveIds: z.array(z.string()),
  structures: z.array(campaignStructure),
  samGroups: z.array(campaignSamGroup),
  groundGroups: z.array(campaignGroundGroup),
  flightGroups: z.array(flightGroup)
})

export const campaign = z.object({
  version: z.string(),
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  time: z.date(),
  timeMultiplier: z.number(),
  timeTarget: z.date().optional(),
  scenarioId: z.string(),
  coalitions: z.record(coalition, campaignCoalition)
})

export const campaignSummary = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date()
})
