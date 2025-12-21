import type { schemas } from '@dcc/contracts'
import * as z from 'zod'

// Helper function to get objective position by ID
export function getObjectivePosition(
  theatre: z.infer<typeof schemas.theatre>,
  objectiveId: string
): z.infer<typeof schemas.position> | null {
  const objective = theatre.objectives.find((obj) => obj.name === objectiveId)
  return objective?.position ?? null
}
