import type { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { spawnStrike } from './strike'

export function spawnPackages(coalition: z.infer<typeof schemas.coalition>) {
  spawnStrike(coalition)
}
