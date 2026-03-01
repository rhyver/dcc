import { campaign as campaignSchemas } from './campaign/schemas'
import {
  campaign as campaignContract,
  data as dataContract,
  missionGenerator as missionGeneratorContract
} from './contract'
import { dcs as dcsSchemas } from './dcs'
import * as missionGeneratorSchemas from './mission-generator/schemas'
import * as otherSchemas from './schemas'

export const schemas = {
  campaign: campaignSchemas,
  dcs: dcsSchemas,
  missionGenerator: missionGeneratorSchemas,
  ...otherSchemas
}

export const contract = {
  campaign: campaignContract,
  data: dataContract,
  missionGenerator: missionGeneratorContract
}

export * from './config'
