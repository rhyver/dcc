import * as z from 'zod'

export const chatMessage = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1)
})

const coalitionFlight = z.object({
  aircraftType: z.string(),
  task: z.enum(['CAP', 'SEAD', 'Pinpoint Strike', 'Ground Attack', 'CAS', 'Escort', 'Transport']),
  count: z.number().int().min(1).max(8).default(2),
  homeAirbase: z.string()
})

const samPlacement = z.object({
  samType: z.enum(['SA-10-300', 'SA-6', 'SA-5', 'SA-3', 'SA-2', 'Hawk']),
  objectiveName: z.string()
})

const aaaPlacement = z.object({
  aaaType: z.string().default('AAA'),
  objectiveName: z.string(),
  count: z.number().int().min(1).max(12).default(2)
})

export const missionPlan = z.object({
  title: z.string(),
  theatreName: z.string(),
  era: z.enum(['WW2', 'Korea', 'Vietnam', 'Late CW', 'Modern']).default('Modern'),
  startTimeZulu: z.string().optional(),
  weatherSummary: z.string().optional(),
  objectiveNames: z.array(z.string()).min(1),
  playerCoalition: z.object({
    factionId: z.string().default('usa-2004'),
    primaryFlight: coalitionFlight
  }),
  opponentCoalition: z.object({
    factionId: z.string().default('russia-1996'),
    capFlights: z.array(coalitionFlight).default([]),
    samPlacements: z.array(samPlacement).default([]),
    aaaPlacements: z.array(aaaPlacement).default([])
  }),
  friendlySupport: z.object({
    awacs: z.boolean().default(false),
    seadEscort: z.boolean().default(false),
    tanker: z.boolean().default(false)
  })
})

export const savedBriefing = z.object({
  id: z.string(),
  name: z.string(),
  briefing: z.string(),
  messages: z.array(chatMessage),
  missionPlan: missionPlan.optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const savedBriefingSummary = savedBriefing.pick({
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true
})
