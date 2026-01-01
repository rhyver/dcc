import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export type GroundGroupData = z.infer<typeof schemas.groundGroup>

export class GroundGroup {
  static create(
    draft: z.infer<typeof schemas.campaign.campaign>,
    coalition: z.infer<typeof schemas.coalition>,
    params: {
      position: z.infer<typeof schemas.position>
      objectiveId?: string
      units: GroundGroupData['units']
      state?: GroundGroupData['state']
    }
  ): void {
    const newGroup: GroundGroupData = {
      id: crypto.randomUUID(),
      position: params.position,
      objectiveId: params.objectiveId,
      units: params.units,
      state: params.state ?? 'idle'
    }

    draft.coalitions[coalition].groundGroups.push(newGroup)
  }

  constructor(protected _data: GroundGroupData) {}

  get id() {
    return this._data.id
  }

  get position() {
    return this._data.position
  }

  get units() {
    return this._data.units
  }

  get state() {
    return this._data.state
  }

  setPosition(pos: z.infer<typeof schemas.position>) {
    this._data.position = pos
  }
}
