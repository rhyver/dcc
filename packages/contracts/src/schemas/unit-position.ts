import * as z from 'zod'

import { position } from './position'

export const unitPosition = position.extend({
  heading: z.number()
})
