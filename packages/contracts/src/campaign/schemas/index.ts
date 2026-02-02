import { campaign as campaignSchema, campaignSamGroup, campaignSummary } from './campaign'
import { entityTypeSchema } from './entity'
import { settings } from './settings'

export const campaign = {
  campaign: campaignSchema,
  campaignSamGroup,
  campaignSummary,
  entityType: entityTypeSchema,
  settings
}
