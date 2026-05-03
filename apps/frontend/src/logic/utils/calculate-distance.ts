import type { schemas } from '@dcc/contracts'
import * as z from 'zod'

// Helper function to calculate distance between two positions
export function calculateDistance(
  pos1: z.infer<typeof schemas.position>,
  pos2: z.infer<typeof schemas.position>
): number {
  const dx = pos1.x - pos2.x
  const dy = pos1.y - pos2.y
  return Math.sqrt(dx * dx + dy * dy)
}
