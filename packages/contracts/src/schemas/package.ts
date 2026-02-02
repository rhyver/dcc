import * as z from 'zod'

export const packageMemberRole = z.enum(['primary', 'sead'])

export const packageMember = z.object({
  flightGroupId: z.string(),
  role: packageMemberRole,
  totOffset: z.number() // milliseconds offset from package ToT
})

export const packageType = z.enum(['Strike Package', 'SEAD Strike Package'])

export const packageStatus = z.enum(['active', 'completed'])

export const missionPackage = z.object({
  id: z.string(),
  type: packageType,
  targetObjectiveId: z.string(),
  members: z.array(packageMember),
  tot: z.date(),
  status: packageStatus
})
