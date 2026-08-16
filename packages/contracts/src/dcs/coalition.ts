import * as z from 'zod'

export const coalition = z.enum(['BLUE', 'RED', 'NEUTRAL', 'blue', 'red', 'neutral'])
