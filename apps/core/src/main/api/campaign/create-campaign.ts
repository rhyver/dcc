import { getFactions } from '../data/get-factions'
import { getScenarios } from '../data/get-scenarios'
import { getTemplates } from '../data/get-templates'
import { pub } from '../orpc'
import * as z from 'zod'
import { schemas } from '@dcc/contracts'
import { writeFile } from '../../utils'
import path from 'path'
import { app } from 'electron'
import { getTheatre } from '../data/get-theatre'
import { assignObjectivesToCoalitions } from './assign-objectives-to-coalitions'
import { assignStructures } from './assign-structures'

const stateFile = path.join(app.getPath('userData'), 'state.json')

export const createCampaign = pub.campaign.createCampaign.handler(async ({ errors }) => {
  const scenarios = getScenarios()
  const scenario = scenarios?.[0]
  if (scenario == null) {
    throw errors.NOT_FOUND({ data: { message: 'No scenario found', path: 'red-bullet' } })
  }

  const theatre = getTheatre(scenario.theatreName)
  if (theatre == null) {
    throw errors.NOT_FOUND({ data: { message: 'No theatre found', path: scenario.theatreName } })
  }

  const objectives = theatre.objectives
  const objectiveMap = new Map(objectives.map((o) => [o.name, o]))

  const objectiveAssignments = assignObjectivesToCoalitions({
    objectives,
    start: scenario.start,
    onMissingObjective: ({ coalition, objectiveId }) => {
      throw errors.NOT_FOUND({
        data: {
          message: `Objective ${objectiveId} not found in theatre ${theatre.name}`,
          path: `scenario.start.${coalition}.objectiveIds`
        }
      })
    }
  })

  const getStructures = (objectiveIds: string[]) => {
    const coalitionObjectives = objectiveIds.map((id) => {
      const obj = objectiveMap.get(id)
      if (!obj) throw new Error(`Objective ${id} not found`) // Should be caught earlier but safe to check
      return { id: obj.name, position: obj.position }
    })

    const assignments = assignStructures(coalitionObjectives)

    return assignments.map((assignment) => {
      return {
        id: crypto.randomUUID(),
        type: assignment.type,
        objectiveId: assignment.objectiveId
      }
    })
  }

  const factions = getFactions()
  const playerFaction = factions.find((faction) => faction.id === 'usa-2004')
  const opponentFaction = factions.find((faction) => faction.id === 'russia-1996')

  if (playerFaction == null || opponentFaction == null) {
    throw errors.NOT_FOUND({
      data: { message: 'No factions found', path: 'usa-2004 or russia-1996' }
    })
  }

  const templates = getTemplates()
  const playerTemplate = templates.find((template) => template.name === playerFaction.templateName)
  const opponentTemplate = templates.find(
    (template) => template.name === opponentFaction.templateName
  )
  if (playerTemplate == null || opponentTemplate == null) {
    throw errors.NOT_FOUND({
      data: { message: 'No templates found', path: 'usa-modern or russia-modern' }
    })
  }

  const playerStructures = getStructures(objectiveAssignments.player ?? [])
  const opponentStructures = getStructures(objectiveAssignments.opponent ?? [])

  const defaultState: z.infer<typeof schemas.campaign.campaign> = {
    version: '0.0.1',
    createdAt: new Date(),
    id: crypto.randomUUID(),
    name: scenario.name,
    time: scenario.date,
    timeMultiplier: 0,
    scenarioId: 'red-bullet',
    coalitions: {
      player: {
        id: playerFaction.id,
        aircraftTypes: playerFaction.aircraftTypes,
        groundUnitTypes: playerTemplate.groundUnitTypes,
        airdromeNames: scenario.start.player.airdromeNames,
        objectiveIds: objectiveAssignments.player ?? [],
        structures: playerStructures
      },
      opponent: {
        id: opponentFaction.id,
        aircraftTypes: opponentFaction.aircraftTypes,
        groundUnitTypes: opponentTemplate.groundUnitTypes,
        airdromeNames: scenario.start.opponent.airdromeNames,
        objectiveIds: objectiveAssignments.opponent ?? [],
        structures: opponentStructures
      }
    }
  }

  const result = schemas.campaign.campaign.safeParse(defaultState)
  if (!result.success) {
    console.log('result.error', result.error)
  }
  const writeFileResult = await writeFile(stateFile, defaultState)
  return writeFileResult.match(
    () => defaultState,
    (error) => {
      throw errors.FAILED_TO_WRITE_FILE({ data: { path: stateFile, message: error.message } })
    }
  )
})
