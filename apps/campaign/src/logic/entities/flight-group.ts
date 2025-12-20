import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export interface FlightGroupArgs {
  id?: string
  task: z.infer<typeof schemas.task>
  position: z.infer<typeof schemas.position>
  homeBase: string
}

export interface FlightGroupCreateArgs {
  task: z.infer<typeof schemas.task>
  homeBase: string
}

export class FlightGroup {
  public readonly id: string
  public readonly task: z.infer<typeof schemas.task>
  private position: z.infer<typeof schemas.position>
  private homeBase: string

  constructor(args: FlightGroupArgs) {
    this.id = args.id ?? crypto.randomUUID()
    this.task = args.task
  }

  static create(args: FlightGroupArgs) {
    const group = new FlightGroup(args)
  }
}
