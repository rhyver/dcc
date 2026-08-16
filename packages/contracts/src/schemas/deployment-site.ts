import * as z from 'zod'

import { position } from './position'
import { unitPosition } from './unit-position'

export const deploymentSiteRole = z.enum([
  'defensive',
  'staging',
  'reserve',
  'artillery',
  'air-defense',
  'infantry',
  'vehicle',
  'recovery',
  'extraction'
])

export const deploymentSitePosture = z.enum([
  'dispersed-defense',
  'staging-column',
  'artillery-battery',
  'air-defense-ring',
  'recovery-area',
  'landing-zone'
])

export const deploymentSiteSlot = unitPosition.extend({
  id: z.string(),
  allowedUnitKinds: z.array(z.enum(['infantry', 'vehicle', 'air-defense', 'artillery'])).min(1)
})

export const deploymentSite = z.object({
  id: z.string(),
  objectiveId: z.string(),
  position,
  roles: z.array(deploymentSiteRole).min(1),
  posture: deploymentSitePosture,
  slots: z.array(deploymentSiteSlot).min(1),
  ingress: z.array(position).optional(),
  egress: z.array(position).optional(),
  extractionRadius: z.number().positive().optional(),
  validationStatus: z.enum(['candidate', 'approved']).optional(),
  source: z.enum(['authored', 'extracted', 'legacy-target']).default('authored')
})

export const objectiveConnection = z.object({
  from: z.string(),
  to: z.string(),
  mode: z.enum(['road', 'off-road', 'foot', 'sea']),
  bidirectional: z.boolean().default(true),
  waypoints: z.array(position).default([])
})
