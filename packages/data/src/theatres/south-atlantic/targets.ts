import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { deploymentSites } from './deployment-sites'
import { southAtlanticObjectivePositions } from './objectives'
import { reviewedStructurePlacementOverrides } from './reviewed-miz-placements'

type Target = z.infer<typeof schemas.target>
type StructurePlacement = {
  position: { x: number; y: number; heading: number }
  unitPositions: readonly { x: number; y: number; heading: number }[]
}

const structurePlacementOverrides: Record<string, StructurePlacement> =
  reviewedStructurePlacementOverrides

const falklandsSamObjectives = new Set([
  'Goose Green',
  'Stanley Airport',
  'Evelyn Station Farm',
  'Fox Bay'
])

export const targets: Record<string, Target[]> = Object.fromEntries(
  Object.entries(southAtlanticObjectivePositions).map(([objectiveId, position]) => {
    const sites = deploymentSites.filter((site) => site.objectiveId === objectiveId)
    const tacticalTargets: Target[] = sites.map((site) => {
      const isAirDefense = site.roles.includes('air-defense')
      const isLandingSam = falklandsSamObjectives.has(objectiveId) && isAirDefense
      return {
        name: `${objectiveId}|${isLandingSam ? 'SAM' : isAirDefense ? 'AAA' : 'Vehicle'}|${isLandingSam ? 3 : isAirDefense ? 2 : 1}`,
        objectiveName: objectiveId,
        groupId: isLandingSam ? 3 : isAirDefense ? 2 : 1,
        type: isLandingSam ? 'SAM' : isAirDefense ? 'AAA' : 'Vehicle',
        position: site.position,
        unitPositions: site.slots.map((slot) => ({
          x: slot.x,
          y: slot.y,
          heading: slot.heading
        }))
      }
    })
    const reviewedStructure = structurePlacementOverrides[objectiveId]
    tacticalTargets.push({
      name: `${objectiveId}|Structure|100`,
      objectiveName: objectiveId,
      groupId: 100,
      type: 'Structure',
      position: reviewedStructure?.position ?? position,
      unitPositions:
        reviewedStructure?.unitPositions.map((unitPosition) => ({ ...unitPosition })) ??
        Array.from({ length: 8 }, (_, index) => ({
          x: position.x + (index % 4) * 80 - 120,
          y: position.y + Math.floor(index / 4) * 100 - 50,
          heading: 0
        }))
    })
    return [objectiveId, tacticalTargets]
  })
)
