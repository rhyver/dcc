import { campaign as campaignSchemas } from './campaign/schemas'
import { campaign as campaignContract, data as dataContract } from './contract'
import { dcs as dcsSchemas } from './dcs'
import * as otherSchemas from './schemas'

export const schemas = {
  campaign: campaignSchemas,
  dcs: dcsSchemas,
  ...otherSchemas
}

export const contract = {
  campaign: campaignContract,
  data: dataContract
}

export * from './config'
