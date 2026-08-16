import { southAtlantic } from '../src/theatres/south-atlantic'

const requireApproved = process.argv.includes('--require-approved')
const errors: string[] = []
const warnings: string[] = []
const objectiveIds = new Set(southAtlantic.objectives.map((objective) => objective.name))
const siteIds = new Set<string>()
const slotIds = new Set<string>()
const slotPositions: Array<{ id: string; x: number; y: number }> = []

for (const site of southAtlantic.deploymentSites ?? []) {
  if (siteIds.has(site.id)) errors.push(`Duplicate deployment site id: ${site.id}`)
  siteIds.add(site.id)
  if (!objectiveIds.has(site.objectiveId)) {
    errors.push(`${site.id}: objective ${site.objectiveId} does not exist`)
  }
  if (site.validationStatus === 'candidate') {
    warnings.push(`${site.id}: candidate is excluded from runtime allocation`)
  }
  if (site.slots.length === 0) errors.push(`${site.id}: no slots`)
  if (site.roles.includes('extraction') && (site.extractionRadius ?? 0) < 100) {
    errors.push(`${site.id}: extraction site requires a radius of at least 100m`)
  }
  for (const slot of site.slots) {
    if (slotIds.has(slot.id)) errors.push(`Duplicate deployment slot id: ${slot.id}`)
    slotIds.add(slot.id)
    if (slot.allowedUnitKinds.length === 0) errors.push(`${slot.id}: no allowed unit kinds`)
    for (const existing of slotPositions) {
      if (Math.hypot(existing.x - slot.x, existing.y - slot.y) < 8) {
        errors.push(`${slot.id}: overlaps ${existing.id} within 8m`)
      }
    }
    slotPositions.push({ id: slot.id, x: slot.x, y: slot.y })
  }
}

for (const connection of southAtlantic.connections ?? []) {
  if (!objectiveIds.has(connection.from)) errors.push(`Route source missing: ${connection.from}`)
  if (!objectiveIds.has(connection.to)) errors.push(`Route destination missing: ${connection.to}`)
  if (connection.from === connection.to) errors.push(`Self-referencing route: ${connection.from}`)
}

const approvedSanCarlos = (southAtlantic.deploymentSites ?? []).filter(
  (site) =>
    site.objectiveId === 'San Carlos' &&
    site.validationStatus !== 'candidate' &&
    site.slots.length >= 4
)
if (requireApproved && approvedSanCarlos.length < 3) {
  errors.push('Release gate: San Carlos requires three approved sites with at least four slots')
}

const recoveryObjectives = new Set(
  (southAtlantic.deploymentSites ?? [])
    .filter((site) => site.roles.includes('recovery') && site.validationStatus !== 'candidate')
    .map((site) => site.objectiveId)
)
if (requireApproved && recoveryObjectives.size < 2) {
  errors.push('Release gate: at least two objectives require approved local recovery sites')
}

const summary = {
  theatre: southAtlantic.name,
  objectives: southAtlantic.objectives.length,
  connections: southAtlantic.connections?.length ?? 0,
  sites: southAtlantic.deploymentSites?.length ?? 0,
  approvedSites: (southAtlantic.deploymentSites ?? []).filter(
    (site) => site.validationStatus !== 'candidate'
  ).length,
  candidateSites: (southAtlantic.deploymentSites ?? []).filter(
    (site) => site.validationStatus === 'candidate'
  ).length,
  slots: slotIds.size,
  warnings: warnings.length,
  errors: errors.length
}

console.log(JSON.stringify(summary, null, 2))
for (const warning of warnings) console.warn(`WARNING ${warning}`)
for (const error of errors) console.error(`ERROR ${error}`)
if (errors.length > 0) process.exit(1)
