import {
  campaign as campaignSchema,
  campaignDownedPilot,
  campaignEwrGroup,
  campaignSamGroup,
  campaignSummary
} from './campaign'
import { entityTypeSchema } from './entity'
import { settings, settingsOutput } from './settings'

export const campaign = {
  campaign: campaignSchema,
  campaignDownedPilot,
  campaignEwrGroup,
  campaignSamGroup,
  campaignSummary,
  entityType: entityTypeSchema,
  settings,
  settingsOutput
}
