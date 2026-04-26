import { campaign as campaignSchema, campaignSamGroup, campaignSummary } from './campaign'
import { entityTypeSchema } from './entity'
import { settings, settingsOutput } from './settings'

export const campaign = {
  campaign: campaignSchema,
  campaignSamGroup,
  campaignSummary,
  entityType: entityTypeSchema,
  settings,
  settingsOutput
}
