import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export interface EntityArgs {
  id?: string
  type: z.infer<typeof schemas.campaign.entityType>
}
export abstract class Entity {
  public readonly id: string
  public readonly type: z.infer<typeof schemas.campaign.entityType>

  constructor(args: EntityArgs) {
    this.id = args.id ?? crypto.randomUUID()
    this.type = args.type
  }
}
