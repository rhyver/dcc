import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { reviewedObjectivePositionOverrides } from './reviewed-miz-placements'

export const southAtlanticIntermediateObjectivePositions = {
  'Ajax Bay': { x: 100_949, y: 3_428 },
  'Douglas Settlement': { x: 113_309, y: 35_917 },
  "L'Antioja": { x: 72_636, y: 39_919 },
  'Estancia House': { x: 90_747, y: 63_496 },
  'Mount Challenger': { x: 85_477.06146882, y: 72_373.905075646 },
  'Mount Harriet': { x: 85_360, y: 78_513 },
  'Sapper Hill': { x: 86_760, y: 82_456 },
  'Moody Brook': { x: 88_120, y: 83_913 },
  'Murrell Farm': { x: 90_899, y: 85_774 },
  'Port Louis': { x: 105_926, y: 69_440 },
  "Johnson's Harbour": { x: 109_489, y: 75_482 },
  'Volunteer Point': { x: 108_598, y: 94_855 },
  'Cape Dolphin': { x: 133_913, y: 12_953 },
  'Little Creek': { x: 121_475, y: 19_399 },
  'Bull Point': { x: 14_108.63550132, y: -10_163.166050783 },
  'North Arm': { x: 38_042, y: -14_453 },
  'Swan Inlet': { x: 69_294.022817398, y: 37_855.076050529 },
  'Port Harriet': { x: 81_694, y: 80_329 },
  'Mount Usborne': { x: 86_317, y: 21_280 },
  'Hill Cove': { x: 104_885, y: -69_744 },
  'Roy Cove': { x: 99_129, y: -87_472 },
  Chartres: { x: 81_231, y: -62_534 },
  'Port Stephens': { x: 36_388, y: -113_387 },
  'Port Edgar': { x: 44_080.825830883, y: -77_467.184115475 },
  'Pebble Island': { x: 128_324, y: -34_795 },
  'Shallow Bay': { x: 114_274, y: -60_741 },
  'Warrah River': { x: 109_021, y: -34_345 }
} as const

export const southAtlanticObjectivePositions = reviewedObjectivePositionOverrides

const airports = new Set(['Stanley Airport', 'Rio Grande', 'Rio Gallegos', 'San Julian'])
const terrain = new Set([
  'Mount Kent',
  'Two Sisters',
  'Mount Longdon',
  'Wireless Ridge',
  'Mount Tumbledown',
  'Mount Challenger',
  'Mount Harriet',
  'Sapper Hill',
  'Mount Usborne'
])

export const objectives: z.infer<typeof schemas.objective>[] = Object.entries(
  southAtlanticObjectivePositions
).map(([name, position]) => ({
  name,
  position,
  type: airports.has(name) ? 'Airport' : terrain.has(name) ? 'Terrain' : 'Town'
}))
