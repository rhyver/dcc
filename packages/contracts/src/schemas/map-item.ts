import * as z from 'zod'

import { coalition } from './coalition'
import { groundUnitType } from './ground-unit-type'
import { structureType } from './structure-type'
import { task } from './task'

const mapItem = z.object({
  id: z.string(),
  name: z.string(),
  coalition,
  position: z.object({
    lng: z.number(),
    lat: z.number()
  })
})

export const AirdromeMapItem = mapItem.extend({
  type: z.literal('Airdrome')
})

export const FlightGroupMapItem = mapItem.extend({
  type: z.literal('Flight Group'),
  task
})

export const StructureMapItem = mapItem.extend({
  type: z.literal('Structure'),
  structureType: structureType
})

export const GroundGroupMapItem = mapItem.extend({
  type: z.literal('Ground Group'),
  groundGroupType: groundUnitType
})

export const DownedPilotMapItem = mapItem.extend({
  type: z.literal('Downed Pilot')
})

export const SamMapItem = mapItem.extend({
  type: z.literal('SAM'),
  range: z.number(),
  active: z.boolean()
})

export const MapItem = z.discriminatedUnion('type', [
  AirdromeMapItem,
  FlightGroupMapItem,
  StructureMapItem,
  GroundGroupMapItem,
  DownedPilotMapItem,
  SamMapItem
])
