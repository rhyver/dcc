import * as z from 'zod'

export const position = z.object({
  x: z.number(),
  y: z.number()
})
