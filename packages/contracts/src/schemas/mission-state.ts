import * as z from 'zod'

const missionStateUnit = z
  .object({
    name: z.string(),
    type: z.string(),
    x: z.number(),
    y: z.number()
  })
  .passthrough()

const missionStateGroup = z.object({
  name: z.string(),
  x: z.number(),
  y: z.number(),
  units: z.array(missionStateUnit).default([])
})

const coalitionPositions = z
  .object({
    aircraft: z.array(missionStateGroup).default([]),
    ground: z.array(missionStateGroup).default([])
  })
  .default({ aircraft: [], ground: [] })

// Lua JSON encoders may encode empty tables as [] instead of {}.
// Use a preprocess step to normalize arrays to the expected object shape.
const coalitionPositionsLenient = z.preprocess(
  (val) => (Array.isArray(val) ? { aircraft: [], ground: [] } : val),
  coalitionPositions
)

const missionStateGroupPositions = z.object({
  blue: coalitionPositionsLenient,
  red: coalitionPositionsLenient
})

export const missionState = z
  .object({
    missionId: z.string(),
    missionEnded: z.boolean().optional(),
    time: z.number().optional(),
    ejectedPilots: z
      .array(
        z.object({
          name: z.string(),
          x: z.number(),
          y: z.number()
        })
      )
      .default([]),
    lostUnits: z
      .array(
        z.object({
          name: z.string(),
          groupName: z.string().nullable().optional(),
          type: z.string().default('unknown'),
          category: z.number().optional(),
          x: z.number(),
          y: z.number()
        })
      )
      .default([]),
    cargoDeliveries: z
      .record(
        z.string(),
        z.object({
          time: z.number(),
          x: z.number(),
          y: z.number()
        })
      )
      .default({}),
    groupPositions: missionStateGroupPositions.optional()
  })
  .passthrough()
