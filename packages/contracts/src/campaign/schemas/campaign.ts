import * as z from 'zod'

import { flightGroup, groundGroup, missionPackage } from '../../schemas'
import { coalition } from '../../schemas/coalition'
import { era } from '../../schemas/era'
import { groundUnitType } from '../../schemas/ground-unit-type'
import { position } from '../../schemas/position'
import { samType } from '../../schemas/sam'
import { structureBuilding } from '../../schemas/structure-building'
import { supply } from '../../schemas/supply'
import { task } from '../../schemas/task'

const campaignLogEntry = z.object({
  id: z.string(),
  type: z.enum(['spawn', 'combat', 'landing', 'campaign']),
  coalition: coalition,
  label: z.string().optional(),
  entityType: z.enum(['flightGroup', 'groundGroup']).optional(),
  entityId: z.string().optional(),
  campaignTime: z.string(),
  message: z.string(),
  createdAt: z.string()
})

const campaignStatus = z.enum(['active', 'won', 'lost'])

const campaignGoal = z.object({
  coalition,
  objectiveIds: z.array(z.string()).min(1)
})

const campaignStructure = z.preprocess(
  (input) => {
    if (input == null || typeof input !== 'object') return input

    const rawStructure = input as { resources?: unknown; buildings?: unknown[] }
    if (rawStructure.resources != null) return input
    if (!Array.isArray(rawStructure.buildings)) return input

    // Backward compatibility for old saves where resources were stored on buildings.
    let migratedResources = 0
    for (const building of rawStructure.buildings) {
      if (building == null || typeof building !== 'object') continue
      const rawResources = (building as { resources?: unknown }).resources
      if (typeof rawResources === 'number') {
        migratedResources += rawResources
      }
    }

    return {
      ...rawStructure,
      resources: migratedResources
    }
  },
  z.object({
    id: z.string(),
    type: z.string(),
    objectiveId: z.string(),
    position,
    name: z.string(),
    resources: z.number().default(0),
    buildings: z.array(structureBuilding)
  })
)

export const campaignSamGroup = z.object({
  id: z.string(),
  type: samType,
  objectiveId: z.string(),
  deadUnitIndexes: z.array(z.number().int().nonnegative()).optional(),
  suppressed: z.boolean().optional(),
  destroyed: z.boolean().optional()
})

const campaignCoalition = z.object({
  id: z.string(),
  aircraftTypes: z.record(task, z.array(z.string())),
  groundUnitTypes: z.record(groundUnitType, z.array(z.string())),
  airdromeNames: z.array(z.string()),
  objectiveIds: z.array(z.string()),
  structures: z.array(campaignStructure),
  samGroups: z.array(campaignSamGroup),
  groundGroups: z.array(groundGroup),
  flightGroups: z.array(flightGroup),
  packages: z.array(missionPackage),
  supplyNodes: z.record(z.string(), supply).optional()
})

export const campaign = z.preprocess(
  (input) => {
    if (input == null || typeof input !== 'object') return input

    const rawCampaign = input as { createdAt?: unknown; updatedAt?: unknown }
    if (rawCampaign.updatedAt != null) return input

    return {
      ...rawCampaign,
      updatedAt: rawCampaign.createdAt
    }
  },
  z.object({
    version: z.string(),
    id: z.string(),
    name: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    era: era.optional(),
    time: z.date(),
    timeMultiplier: z.number(),
    timeTarget: z.date().optional(),
    status: campaignStatus.optional(),
    goal: campaignGoal.optional(),
    campaignParams: z
      .object({
        hotStart: z.boolean().optional(),
        culling: z.boolean().optional(),
        ewr: z.boolean().optional(),
        exactTarget: z.boolean().optional(),
        casJtac: z.boolean().optional()
      })
      .optional(),
    logs: z.array(campaignLogEntry).default([]),
    scenarioId: z.string(),
    coalitions: z.record(coalition, campaignCoalition)
  })
)

export const campaignSummary = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})
