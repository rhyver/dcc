import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export type FlightGroupData = z.infer<typeof schemas.flightGroup>

export class FlightGroup {
  static getCoalitionFlightGroups(
    draft: z.infer<typeof schemas.campaign.campaign>,
    coalition: z.infer<typeof schemas.coalition>
  ): FlightGroup[] {
    return draft.coalitions[coalition].flightGroups.map((data) => new FlightGroup(data))
  }

  constructor(protected _data: FlightGroupData) {}

  // Getters read from the wrapped data object
  get id() {
    return this._data.id
  }

  get task() {
    return this._data.task
  }

  get position() {
    return this._data.position
  }

  get homeBase() {
    return this._data.homeBase
  }

  get aircrafts() {
    return this._data.aircrafts
  }

  // Setters mutate the wrapped data object (works with Immer drafts)
  setPosition(newPosition: z.infer<typeof schemas.position>) {
    this._data.position = newPosition
  }

  setHomeBase(newHomeBase: string) {
    this._data.homeBase = newHomeBase
  }

  // Logic methods can be added here
  updateLogic(_delta: number) {
    // Example: Update flight group logic based on delta time
    // This mutates the internal _data object which can be an Immer draft
  }
}
