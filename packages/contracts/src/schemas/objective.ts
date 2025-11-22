import * as z from 'zod'

import { position } from './position'

export const objective = z.object({
  name: z.string(),
  type: z.string(),
  position
})
