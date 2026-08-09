import { scenarios, templates, theatres } from '@dcc/data'
import { assignStructures } from '@dcc/frontend/mission-generator'
import { describe, expect, test } from 'vitest'

import { assignGroundGroups } from './assign-ground-groups'

const intermediateObjectiveIds = [
  'Ajax Bay',
  'Douglas Settlement',
  "L'Antioja",
  'Estancia House',
  'Mount Challenger',
  'Mount Harriet',
  'Sapper Hill',
  'Moody Brook',
  'Murrell Farm',
  'Port Louis',
  "Johnson's Harbour",
  'Volunteer Point',
  'Cape Dolphin',
  'Little Creek',
  'Bull Point',
  'North Arm',
  'Swan Inlet',
  'Port Harriet',
  'Mount Usborne',
  'Hill Cove',
  'Roy Cove',
  'Chartres',
  'Port Stephens',
  'Port Edgar',
  'Pebble Island',
  'Shallow Bay',
  'Warrah River'
]

describe('Falklands intermediate objectives', () => {
  test('are connected, populated, and occupied at campaign start', () => {
    const scenario = scenarios.find((candidate) => candidate.id === 'falklands-1982')
    const theatre = theatres.find((candidate) => candidate.name === 'SouthAtlantic')
    expect(scenario).toBeDefined()
    expect(theatre).toBeDefined()

    for (const objectiveId of intermediateObjectiveIds) {
      expect(theatre?.objectives.some((objective) => objective.name === objectiveId)).toBe(true)
      expect(scenario?.start.opponent.objectiveIds).toContain(objectiveId)
      expect(
        theatre?.connections?.some(
          (connection) => connection.from === objectiveId || connection.to === objectiveId
        )
      ).toBe(true)
      expect(
        theatre?.deploymentSites?.filter((site) => site.objectiveId === objectiveId).length
      ).toBeGreaterThanOrEqual(2)
      expect(theatre?.targets[objectiveId]?.some((target) => target.type === 'Structure')).toBe(
        true
      )
      expect(theatre?.targets[objectiveId]?.some((target) => target.type === 'Vehicle')).toBe(true)
    }
  })

  test('seeds one Argentine defensive formation at every active objective', () => {
    const scenario = scenarios.find((candidate) => candidate.id === 'falklands-1982')!
    const theatre = theatres.find((candidate) => candidate.name === 'SouthAtlantic')!
    const template = templates.find((candidate) => candidate.name === 'Argentina - Falklands 1982')!
    const coalitionObjectives = scenario.start.opponent.objectiveIds.map((objectiveId) => {
      const objective = theatre.objectives.find((candidate) => candidate.name === objectiveId)!
      return {
        id: objectiveId,
        position: objective.position,
        targets: theatre.targets[objectiveId] ?? []
      }
    })

    const assignments = assignGroundGroups({
      coalitionObjectives,
      enemyObjectives: [],
      template,
      defendAllObjectives: true
    })

    expect(assignments).toHaveLength(coalitionObjectives.length)
    expect(
      new Set(
        assignStructures(coalitionObjectives, [], { ensureEveryObjective: true }).map(
          (entry) => entry.objectiveId
        )
      ).size
    ).toBe(coalitionObjectives.length)
  })
})
