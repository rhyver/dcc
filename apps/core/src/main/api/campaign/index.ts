import { pub } from '../orpc'
import { app } from 'electron'
import path from 'path'
import { schemas } from '@dcc/contracts'
import { neverthrowParse, NotFoundError, parseJson, readFile, writeFile } from '../../utils'
import { createCampaign } from './create-campaign'
import { generateMizFromCampaign } from '@dcc/generate-miz'
import { getScenarios } from '../data/get-scenarios'
import { getTheatre } from '../data/get-theatre'

const stateFile = path.join(app.getPath('userData'), 'state.json')
console.log('stateFile', stateFile)

const getActiveCampaign = pub.campaign.getActiveCampaign.handler(async ({ errors }) => {
  const file = await readFile(stateFile)
  if (file.isErr()) {
    if (file.error instanceof NotFoundError) {
      return null
    }
    throw errors.INVALID_APP_STATE({ data: { message: (file.error as Error).message } })
  }
  const parsedState = parseJson(file.value)
  if (parsedState.isErr()) {
    throw errors.INVALID_APP_STATE({ data: { message: parsedState.error.message } })
  }

  const schemaParsedState = neverthrowParse(schemas.campaign.campaign, parsedState.value)
  if (schemaParsedState.isErr()) {
    throw errors.INVALID_APP_STATE({ data: { message: schemaParsedState.error.message } })
  }
  return schemaParsedState.value
})

const saveActiveCampaign = pub.campaign.saveActiveCampaign.handler(async ({ errors, input }) => {
  const writeFileResult = await writeFile(stateFile, input)
  return writeFileResult.match(
    () => campaign,
    (error) => {
      throw errors.FAILED_TO_WRITE_FILE({ data: { path: stateFile, message: error.message } })
    }
  )
})

export const generateMiz = pub.campaign.generateMiz.handler(async ({ input, errors }) => {
  const mizPath = path.join(app.getPath('downloads'), 'dcc_mission.miz')
  const scenarios = getScenarios()
  const scenario = scenarios.find((s) => s.id === input.scenarioId)
  if (scenario == null) {
    throw errors.NOT_FOUND({ data: { message: 'Scenario not found', path: 'scenarioId' } })
  }
  const theatre = getTheatre(scenario.theatreName)
  if (theatre == null) {
    throw errors.NOT_FOUND({ data: { message: 'Theatre not found', path: scenario.theatreName } })
  }
  const result = generateMizFromCampaign(input, theatre, mizPath)
  if (result.isErr()) {
    throw errors.FAILED_TO_WRITE_FILE({ data: { path: mizPath, message: result.error.message } })
  }
  return undefined
})

export const campaign = {
  getActiveCampaign,
  createCampaign,
  saveActiveCampaign,
  generateMiz
}
