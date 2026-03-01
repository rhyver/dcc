import * as z from 'zod'

export const settings = z.object({
  missionExportPath: z.string().optional(),
  dcsInstallPath: z.string().optional(),
  enableDcsPersistence: z.boolean().optional(),
  aiProvider: z.enum(['openai', 'anthropic', 'openrouter']).optional(),
  aiApiKey: z.string().optional(),
  aiModel: z.string().optional(),
  lastViewPath: z.string().optional()
})
