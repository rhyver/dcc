import { campaign as campaignSchemas } from './campaign/schemas'
import { campaign as campaignContract, data as dataContract } from './contract'
import * as otherSchemas from './schemas'

export const schemas = {
  campaign: campaignSchemas,
  ...otherSchemas
}

export const contract = {
  campaign: campaignContract,
  data: dataContract
}
