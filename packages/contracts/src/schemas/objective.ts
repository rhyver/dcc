import * as z from 'zod'

import { position } from './position'
import { supply } from './supply'

export const objective = z.object({
  name: z.string(),
  type: z.string(),
  position,
  supply: supply.optional()
})
