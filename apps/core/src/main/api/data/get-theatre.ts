import { schemas } from '@dcc/contracts'
import * as z from 'zod'
import { theatres } from '@dcc/data'

export function getTheatre(name: string): z.infer<typeof schemas.theatre> | null {
  return theatres.find((theatre) => theatre.name === name) ?? null
}
