import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { scenarios } from '@dcc/data'

export function getScenarios(): z.infer<typeof schemas.scenario>[] {
  return scenarios
}
