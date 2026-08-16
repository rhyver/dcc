import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { southAtlanticIntermediateObjectivePositions } from './objectives'
import {
  type ReviewedDeploymentSite,
  type ReviewedDeploymentSiteKind,
  reviewedDeploymentSites
} from './reviewed-deployment-sites'
import { reviewedDeploymentSiteFirstSlotOverrides } from './reviewed-miz-placements'

type DeploymentSite = z.infer<typeof schemas.deploymentSite>
type DeploymentSiteRole = DeploymentSite['roles'][number]
type DeploymentSitePosture = DeploymentSite['posture']
type UnitKind = DeploymentSite['slots'][number]['allowedUnitKinds'][number]
type ReviewedPosition = { x: number; y: number; heading: number }

const firstSlotOverrides: Record<string, ReviewedPosition> =
  reviewedDeploymentSiteFirstSlotOverrides

const recoveryObjectives = new Set([
  'San Carlos',
  'Port San Carlos',
  'Goose Green',
  'Port Stanley',
  'Stanley Airport',
  'Rio Grande',
  'Rio Gallegos',
  'San Julian'
])
const largeAirDefenseObjectives = new Set(['Stanley Airport', 'Evelyn Station Farm', 'Fox Bay'])

function largeAirDefenseSlots(center: { x: number; y: number }) {
  const inner = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle) => ({
    x: center.x + Math.cos(angle) * 35,
    y: center.y + Math.sin(angle) * 35,
    heading: angle
  }))
  const outer = Array.from({ length: 6 }, (_, index) => {
    const angle = (index * 2 * Math.PI) / 6
    return {
      x: center.x + Math.cos(angle) * 70,
      y: center.y + Math.sin(angle) * 70,
      heading: angle
    }
  })

  return [{ ...center, heading: 0 }, ...inner, ...outer]
}

function defensiveSlots(center: { x: number; y: number }) {
  return Array.from({ length: 8 }, (_, index) => {
    const angle = (index * 2 * Math.PI) / 8
    return {
      x: center.x + Math.cos(angle) * 70,
      y: center.y + Math.sin(angle) * 70,
      heading: angle
    }
  })
}

const intermediateObjectiveIds = new Set(Object.keys(southAtlanticIntermediateObjectivePositions))
const intermediateDeploymentSites: ReviewedDeploymentSite[] = Object.entries(
  southAtlanticIntermediateObjectivePositions
).flatMap(([objectiveId, position]) => {
  const vehiclePosition = { x: position.x - 320, y: position.y - 120 }
  const airDefensePosition = { x: position.x + 320, y: position.y + 120 }
  return [
    {
      objectiveId,
      kind: 'vehicle',
      position: vehiclePosition,
      slots: defensiveSlots(vehiclePosition)
    },
    {
      objectiveId,
      kind: 'airDefense',
      position: airDefensePosition,
      slots: defensiveSlots(airDefensePosition)
    }
  ]
})

interface SiteConfiguration {
  id: string
  roles: DeploymentSiteRole[]
  posture: DeploymentSitePosture
  allowedUnitKinds: UnitKind[]
  extractionRadius?: number
}

function configurationFor(
  objectiveId: string,
  kind: ReviewedDeploymentSiteKind
): SiteConfiguration {
  const recoveryObjective = recoveryObjectives.has(objectiveId)

  switch (kind) {
    case 'vehicle':
      return {
        id: `legacy-${objectiveId}-1-Vehicle`,
        roles: [
          'vehicle',
          'infantry',
          'defensive',
          'staging',
          ...(recoveryObjective ? (['reserve', 'recovery', 'extraction'] as const) : [])
        ],
        posture: recoveryObjective ? 'recovery-area' : 'dispersed-defense',
        allowedUnitKinds: ['vehicle', 'infantry', 'air-defense'],
        extractionRadius: recoveryObjective ? 150 : undefined
      }
    case 'airDefense':
      return {
        id: `legacy-${objectiveId}-2-AAA`,
        roles: ['air-defense', 'defensive'],
        posture: 'air-defense-ring',
        allowedUnitKinds: ['air-defense']
      }
    case 'recovery':
      return {
        id: `recovery-${objectiveId}-reserve`,
        roles: ['reserve', 'recovery', 'extraction', 'staging', 'infantry', 'vehicle'],
        posture: 'recovery-area',
        allowedUnitKinds: ['vehicle', 'infantry'],
        extractionRadius: 180
      }
    case 'infantry':
      return {
        id: `infantry-${objectiveId}-defense`,
        roles: ['infantry', 'defensive'],
        posture: 'dispersed-defense',
        allowedUnitKinds: ['infantry']
      }
    case 'reserve':
      return {
        id: `reserve-${objectiveId}-rear`,
        roles: ['infantry', 'reserve', 'staging'],
        posture: 'dispersed-defense',
        allowedUnitKinds: ['infantry']
      }
  }
}

export const deploymentSites: DeploymentSite[] = [
  ...reviewedDeploymentSites,
  ...intermediateDeploymentSites
].map((reviewed) => {
  const configuration = configurationFor(reviewed.objectiveId, reviewed.kind)
  const isLargeAirDefense =
    reviewed.kind === 'airDefense' && largeAirDefenseObjectives.has(reviewed.objectiveId)
  const sourceSlots = isLargeAirDefense ? largeAirDefenseSlots(reviewed.position) : reviewed.slots
  const firstSlotOverride = firstSlotOverrides[configuration.id]
  const sourceFirstSlot = sourceSlots[0]
  const offset =
    firstSlotOverride && sourceFirstSlot
      ? {
          x: firstSlotOverride.x - sourceFirstSlot.x,
          y: firstSlotOverride.y - sourceFirstSlot.y
        }
      : { x: 0, y: 0 }
  const position = {
    x: reviewed.position.x + offset.x,
    y: reviewed.position.y + offset.y
  }
  return {
    id: configuration.id,
    objectiveId: reviewed.objectiveId,
    position,
    roles: configuration.roles,
    posture: configuration.posture,
    slots: sourceSlots.map((slot, index) => ({
      id: `${configuration.id}-slot-${index + 1}`,
      x: slot.x + offset.x,
      y: slot.y + offset.y,
      heading: index === 0 && firstSlotOverride ? firstSlotOverride.heading : slot.heading,
      allowedUnitKinds: configuration.allowedUnitKinds
    })),
    extractionRadius: configuration.extractionRadius,
    validationStatus: 'approved',
    source:
      isLargeAirDefense || intermediateObjectiveIds.has(reviewed.objectiveId)
        ? 'authored'
        : 'extracted'
  }
})
