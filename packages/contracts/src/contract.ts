import { oc } from '@orpc/contract'
import * as z from 'zod'

import { campaign as campaignSchemas } from './campaign/schemas'
import * as schemas from './schemas'

const base = oc.errors({
  NOT_FOUND: {
    data: z.object({
      message: z.string(),
      path: z.string()
    })
  }
})
const getActiveCampaign = base
  .route({
    summary: 'Get the active campaign',
    tags: ['Campaign', 'Active']
  })
  .errors({
    INVALID_APP_STATE: {
      data: z.object({
        message: z.string()
      })
    }
  })
  .output(campaignSchemas.campaign.nullable())
const saveActiveCampaign = base
  .route({
    summary: 'Save the active campaign',
    tags: ['Campaign', 'Active']
  })
  .input(campaignSchemas.campaign)
  .errors({
    FAILED_TO_WRITE_FILE: {
      data: z.object({
        path: z.string(),
        message: z.string()
      })
    }
  })

const createCampaign = base
  .route({
    summary: 'Create a new campaign',
    tags: ['Campaign', 'Create']
  })
  .errors({
    FAILED_TO_WRITE_FILE: {
      data: z.object({
        path: z.string(),
        message: z.string()
      })
    }
  })
  .output(campaignSchemas.campaign)

const generateMiz = base
  .route({
    summary: 'Generate a MIZ file from the active campaign',
    tags: ['Campaign', 'Generate']
  })
  .errors({
    FAILED_TO_WRITE_FILE: {
      data: z.object({
        path: z.string(),
        message: z.string()
      })
    }
  })
  .input(campaignSchemas.campaign)

export const campaign = {
  getActiveCampaign,
  createCampaign,
  saveActiveCampaign,
  generateMiz
}

const getScenario = base
  .input(z.string())
  .route({
    summary: 'Get a scenario',
    tags: ['Data', 'Scenario']
  })
  .output(schemas.scenario)

const getTheatre = base
  .input(z.string())
  .route({
    summary: 'Get a theatre',
    tags: ['Data', 'Theatre']
  })
  .output(schemas.theatre)

export const data = {
  getScenario,
  getTheatre
}
