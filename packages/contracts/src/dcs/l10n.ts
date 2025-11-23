import { z } from 'zod'

export const dictionary = z.record(z.string(), z.string())

export const mapResource = z.record(z.string(), z.any())

export const l10n = z.object({
  dictionary: dictionary.optional(),
  mapResource: mapResource.optional()
})
