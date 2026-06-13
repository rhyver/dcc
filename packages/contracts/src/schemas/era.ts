import * as z from 'zod'

export const era = z.enum(['WW2', 'Korea', 'Vietnam', 'Late CW', 'Modern'])
