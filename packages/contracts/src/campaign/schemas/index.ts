import { campaign as campaignSchema, campaignSummary } from './campaign'
import { entityTypeSchema } from './entity'
import { settings } from './settings'

export const campaign = {
  campaign: campaignSchema,
  campaignSummary,
  entityType: entityTypeSchema,
  settings
}
