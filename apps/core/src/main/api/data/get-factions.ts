import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { factions } from '@dcc/data'

export function getFactions(): z.infer<typeof schemas.faction>[] {
  return factions
}
