import { oc } from '@orpc/contract'
import * as z from 'zod'

import { campaign as campaignSchemas } from './campaign/schemas'
import * as missionGeneratorSchemas from './mission-generator/schemas'
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

const loadMissionState = base
  .route({
    summary: 'Load mission state from dcc_state.json',
    tags: ['Campaign', 'State']
  })
  .errors({
    FAILED_TO_READ_FILE: {
      data: z.object({
        path: z.string(),
        message: z.string()
      })
    },
    INVALID_STATE_FILE: {
      data: z.object({
        message: z.string()
      })
    }
  })
  .output(schemas.missionState)

const listCampaigns = base
  .route({
    summary: 'List all saved campaigns',
    tags: ['Campaign', 'List']
  })
  .errors({
    FAILED_TO_READ_DIRECTORY: {
      data: z.object({
        path: z.string(),
        message: z.string()
      })
    }
  })
  .output(z.array(campaignSchemas.campaignSummary))

const openCampaign = base
  .route({
    summary: 'Open a specific campaign',
    tags: ['Campaign', 'Open']
  })
  .input(z.object({ id: z.string() }))
  .errors({
    FAILED_TO_WRITE_FILE: {
      data: z.object({
        path: z.string(),
        message: z.string()
      })
    },
    INVALID_APP_STATE: {
      data: z.object({
        message: z.string()
      })
    }
  })
  .output(campaignSchemas.campaign)

const deleteCampaign = base
  .route({
    summary: 'Delete a specific campaign',
    tags: ['Campaign', 'Delete']
  })
  .input(z.object({ id: z.string() }))
  .errors({
    FAILED_TO_DELETE_FILE: {
      data: z.object({
        path: z.string(),
        message: z.string()
      })
    }
  })

const getSettings = base
  .route({
    summary: 'Get application settings',
    tags: ['Campaign', 'Settings']
  })
  .output(campaignSchemas.settings)

const saveSettings = base
  .route({
    summary: 'Save application settings',
    tags: ['Campaign', 'Settings']
  })
  .input(campaignSchemas.settings)
  .errors({
    FAILED_TO_WRITE_FILE: {
      data: z.object({
        path: z.string(),
        message: z.string()
      })
    }
  })

export const campaign = {
  getActiveCampaign,
  createCampaign,
  saveActiveCampaign,
  generateMiz,
  loadMissionState,
  listCampaigns,
  openCampaign,
  deleteCampaign,
  getSettings,
  saveSettings
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

const generateMission = base
  .route({
    summary: 'Generate a single mission .miz from an AI conversation',
    tags: ['Mission Generator', 'Generate']
  })
  .input(
    z.object({
      messages: z.array(missionGeneratorSchemas.chatMessage),
      missionPlan: missionGeneratorSchemas.missionPlan.optional()
    })
  )
  .errors({
    FAILED_TO_WRITE_FILE: {
      data: z.object({
        path: z.string(),
        message: z.string()
      })
    },
    INVALID_APP_STATE: {
      data: z.object({
        message: z.string()
      })
    }
  })
  .output(
    z.object({
      path: z.string(),
      missionPlan: missionGeneratorSchemas.missionPlan
    })
  )

export const missionGenerator = {
  generateMission
}
