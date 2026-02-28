import * as z from 'zod'

export const settings = z.object({
  missionExportPath: z.string().optional(),
  dcsInstallPath: z.string().optional(),
  enableDcsPersistence: z.boolean().optional()
})
