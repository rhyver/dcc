import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { spawnPackages } from './packages'

export function spawn(coalition: z.infer<typeof schemas.coalition>) {
  spawnPackages(coalition)
}
