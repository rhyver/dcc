import * as z from 'zod'

import { flightGroup, groundGroup, missionPackage } from '../../schemas'
import { coalition } from '../../schemas/coalition'
import { groundUnitType } from '../../schemas/ground-unit-type'
import { position } from '../../schemas/position'
import { samType } from '../../schemas/sam'
import { structureBuilding } from '../../schemas/structure-building'
import { supply } from '../../schemas/supply'
import { task } from '../../schemas/task'

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

export const campaign = z.object({
  version: z.string(),
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  time: z.date(),
  timeMultiplier: z.number(),
  timeTarget: z.date().optional(),
  campaignParams: z
    .object({
      hotStart: z.boolean().optional()
    })
    .optional(),
  scenarioId: z.string(),
  coalitions: z.record(coalition, campaignCoalition)
})

export const campaignSummary = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date()
})
