import {
  campaign as campaignSchema,
  campaignDownedPilot,
  campaignSamGroup,
  campaignSummary
} from './campaign'
import { entityTypeSchema } from './entity'
import { settings, settingsOutput } from './settings'

export const campaign = {
  campaign: campaignSchema,
  campaignDownedPilot,
  campaignSamGroup,
  campaignSummary,
  entityType: entityTypeSchema,
  settings,
  settingsOutput
}
