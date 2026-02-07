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

const missionStateGroupPositions = z.object({
  blue: z
    .object({
      aircraft: z.array(missionStateGroup).default([]),
      ground: z.array(missionStateGroup).default([])
    })
    .default({ aircraft: [], ground: [] }),
  red: z
    .object({
      aircraft: z.array(missionStateGroup).default([]),
      ground: z.array(missionStateGroup).default([])
    })
    .default({ aircraft: [], ground: [] })
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
          type: z.string(),
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
