import { parse } from '@dcc/lua-table'
import { theatres } from '@dcc/data'
import AdmZip from 'adm-zip'
import { writeFile } from 'node:fs/promises'

type MissionUnit = {
  name?: string
  x?: number
  y?: number
  heading?: number
}

type MissionGroup = MissionUnit & {
  units?: MissionUnit[]
}

type MissionCountry = {
  static?: { group?: MissionGroup[] }
  vehicle?: { group?: MissionGroup[] }
}

type MissionZone = {
  name?: string
  x?: number
  y?: number
}

type Mission = {
  triggers?: { zones?: MissionZone[] }
  coalition?: { red?: { country?: MissionCountry[] } }
}

const inputPath = process.argv[2] ?? 'C:/Users/juerg/Saved Games/DCS.openbeta/Missions/sa.miz'
const zip = new AdmZip(inputPath)
const missionEntry = zip.getEntry('mission')
if (!missionEntry) throw new Error(`Mission entry is missing from ${inputPath}`)

const missionSource = missionEntry
  .getData()
  .toString('utf8')
  .replace(/^\s*mission\s*=\s*/, '')
const result = parse(missionSource, { mixedKeyTypes: true, emptyTables: 'array' })
if (result.isErr()) throw result.error

const mission = result.value as Mission
const theatre = theatres.find((entry) => entry.name === 'SouthAtlantic')
if (!theatre) throw new Error('South Atlantic theatre is missing')
const countries = mission.coalition?.red?.country ?? []
const surveyZones = (mission.triggers?.zones ?? []).filter((zone) =>
  zone.name?.startsWith('DCC_SURVEY_')
)
const structureGroups = countries
  .flatMap((country) => country.static?.group ?? [])
  .filter((group) => group.name?.startsWith('Static-review-structure-'))
const siteGroups = countries
  .flatMap((country) => country.vehicle?.group ?? [])
  .filter((group) => group.name?.startsWith('Ground-review-site-'))

const groupIndex = (name: string | undefined, prefix: string) => {
  const match = name?.match(new RegExp(`^${prefix}(\\d+)-`))
  return match?.[1] ? Number.parseInt(match[1], 10) - 1 : -1
}

const distance = (a: MissionUnit | undefined, b: MissionUnit | undefined) =>
  a?.x == null || a.y == null || b?.x == null || b.y == null
    ? Number.POSITIVE_INFINITY
    : Math.hypot(a.x - b.x, a.y - b.y)

const changedObjectives = surveyZones.flatMap((zone) => {
  const name = zone.name?.replace(/^DCC_SURVEY_/, '')
  const objective = theatre.objectives.find((entry) => entry.name === name)
  const delta = distance(zone, objective?.position)
  return delta > 0.01 ? [{ name, delta, from: objective?.position, to: zone }] : []
})

const changedStructures = structureGroups.flatMap((group) => {
  const index = groupIndex(group.name, 'Static-review-structure-')
  const objective = theatre.objectives[index]
  const target = objective
    ? theatre.targets[objective.name]?.find((entry) => entry.type === 'Structure')
    : undefined
  const deltas = (group.units ?? []).map((unit, unitIndex) =>
    distance(unit, target?.unitPositions[unitIndex])
  )
  const delta = Math.max(0, ...deltas)
  return delta > 0.01 ? [{ index: index + 1, objective: objective?.name, delta }] : []
})

const changedSites = siteGroups.flatMap((group) => {
  const index = groupIndex(group.name, 'Ground-review-site-')
  const site = theatre.deploymentSites?.[index]
  const delta = distance(group.units?.[0], site?.slots[0])
  return delta > 0.01 ? [{ index: index + 1, site: site?.id, delta }] : []
})

const position = (value: MissionUnit | undefined) => {
  if (value?.x == null || value.y == null) throw new Error('Review object has no position')
  return {
    x: value.x,
    y: value.y,
    heading: value.heading ?? 0
  }
}

if (process.argv.includes('--write')) {
  if (surveyZones.length !== theatre.objectives.length) {
    throw new Error(
      `Expected ${theatre.objectives.length} survey zones, found ${surveyZones.length}`
    )
  }
  if (structureGroups.length !== theatre.objectives.length) {
    throw new Error(
      `Expected ${theatre.objectives.length} structure groups, found ${structureGroups.length}`
    )
  }
  if (siteGroups.length !== theatre.deploymentSites?.length) {
    throw new Error(
      `Expected ${theatre.deploymentSites?.length ?? 0} site groups, found ${siteGroups.length}`
    )
  }

  const objectiveOverrides = Object.fromEntries(
    surveyZones.map((zone) => {
      const objective = zone.name?.replace(/^DCC_SURVEY_/, '')
      if (!objective || zone.x == null || zone.y == null) {
        throw new Error('Survey zone has no matching objective or position')
      }
      return [objective, { x: zone.x, y: zone.y }]
    })
  )
  const structureOverrides = Object.fromEntries(
    structureGroups.map((group) => {
      const index = groupIndex(group.name, 'Static-review-structure-')
      const objective = theatre.objectives[index]?.name
      if (!objective) throw new Error(`Structure ${index + 1} has no matching objective`)
      if (!group.units?.length) throw new Error(`Structure ${index + 1} has no units`)
      return [
        objective,
        {
          position: position(group.units[0]),
          unitPositions: group.units.map(position)
        }
      ]
    })
  )
  const siteOverrides = Object.fromEntries(
    siteGroups.map((group) => {
      const index = groupIndex(group.name, 'Ground-review-site-')
      const site = theatre.deploymentSites?.[index]?.id
      if (!site) throw new Error(`Site ${index + 1} has no matching deployment site`)
      return [site, position(group?.units?.[0])]
    })
  )
  const source = `// Generated from the user-reviewed South Atlantic DCS mission.\n// Re-run \`bun run import:south-atlantic-review -- <path-to-sa.miz> --write\` to refresh.\n\nexport const reviewedObjectivePositionOverrides = ${JSON.stringify(objectiveOverrides, null, 2)} as const\n\nexport const reviewedStructurePlacementOverrides = ${JSON.stringify(structureOverrides, null, 2)} as const\n\nexport const reviewedDeploymentSiteFirstSlotOverrides = ${JSON.stringify(siteOverrides, null, 2)} as const\n`
  const outputUrl = new URL(
    '../../data/src/theatres/south-atlantic/reviewed-miz-placements.ts',
    import.meta.url
  )
  await writeFile(outputUrl, source, 'utf8')
}

console.log(
  JSON.stringify(
    {
      inputPath,
      counts: {
        surveyZones: surveyZones.length,
        structureGroups: structureGroups.length,
        siteGroups: siteGroups.length
      },
      changedObjectives,
      changedStructures,
      changedSites
    },
    null,
    2
  )
)
