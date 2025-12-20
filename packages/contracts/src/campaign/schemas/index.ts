import { campaign as campaignSchema, campaignSummary } from './campaign'
import { entityTypeSchema } from './entity'

export const campaign = {
  campaign: campaignSchema,
  campaignSummary,
  entityType: entityTypeSchema
}
