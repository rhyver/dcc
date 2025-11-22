import { pub } from '../orpc'
import { app } from 'electron'
import path from 'path'
import { schemas } from '@dcc/contracts'
import { neverthrowParse, NotFoundError, parseJson, readFile, writeFile } from '../../utils'
import { createCampaign } from './create-campaign'

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
export const campaign = {
  getActiveCampaign,
  createCampaign,
  saveActiveCampaign
}
