import { getFactions } from '../data/get-factions'
import { getScenarios } from '../data/get-scenarios'
import { getTemplates } from '../data/get-templates'
import { pub } from '../orpc'
import * as z from 'zod'
import { schemas } from '@dcc/contracts'
import { writeFile, ensureDirectory } from '../../utils'
import path from 'path'
import { app } from 'electron'
import { getTheatre } from '../data/get-theatre'
import { assignObjectivesToCoalitions } from './assign-objectives-to-coalitions'
import { assignSams } from './assign-sams'
import { assignStructures } from './assign-structures'
import { assignGroundGroups } from './assign-ground-groups'

const stateFile = path.join(app.getPath('userData'), 'state.json')
const campaignsDir = path.join(app.getPath('userData'), 'campaigns')

async function setActiveCampaignId(id: string) {
  await writeFile(stateFile, { activeCampaignId: id })
}

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

  const getObjectiveInfos = (objectiveIds: string[]) => {
    return objectiveIds.map((id) => {
      const obj = objectiveMap.get(id)
      if (!obj) throw new Error(`Objective ${id} not found`) // Should be caught earlier but safe to check

      const targets = theatre.targets[obj.name] ?? []
      const hasSamTarget = targets.some((t) => t.type === 'SAM')
      return {
        id: obj.name,
        position: obj.position,
        hasSamTarget,
        targets: targets.map((t) => ({ name: t.name, type: t.type, position: t.position }))
      }
    })
  }

  const getStructures = (objectiveIds: string[]) => {
    const coalitionObjectives = getObjectiveInfos(objectiveIds)
    const assignments = assignStructures(coalitionObjectives)

    return assignments.map((assignment) => {
      return {
        id: crypto.randomUUID(),
        type: assignment.type,
        objectiveId: assignment.objectiveId,
        position: assignment.position,
        name: assignment.name,
        buildings: assignment.buildings
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

  // Assign SAM groups to both coalitions
  const playerObjectiveInfos = getObjectiveInfos(objectiveAssignments.player ?? [])
  const opponentObjectiveInfos = getObjectiveInfos(objectiveAssignments.opponent ?? [])

  // Get SAM types from templates (first SAM type defined in groundUnitTypes.SAM)
  const playerSamType = playerTemplate.groundUnitTypes.SAM?.[0] as
    | z.infer<typeof schemas.samType>
    | undefined
  const opponentSamType = opponentTemplate.groundUnitTypes.SAM?.[0] as
    | z.infer<typeof schemas.samType>
    | undefined

  // Player SAMs: cover all player objectives, no restrictions
  const playerSamAssignments = playerSamType
    ? assignSams({
        coalitionObjectives: playerObjectiveInfos,
        samType: playerSamType
      })
    : []

  // Opponent SAMs: cover all opponent objectives, but must NOT reach player objectives
  const opponentSamAssignments = opponentSamType
    ? assignSams({
        coalitionObjectives: opponentObjectiveInfos,
        samType: opponentSamType,
        forbiddenObjectives: playerObjectiveInfos
      })
    : []

  const playerSamGroups = playerSamAssignments.map((assignment) => ({
    id: crypto.randomUUID(),
    type: assignment.type,
    objectiveId: assignment.objectiveId
  }))

  const opponentSamGroups = opponentSamAssignments.map((assignment) => ({
    id: crypto.randomUUID(),
    type: assignment.type,
    objectiveId: assignment.objectiveId
  }))

  const playerGroundAssignments = assignGroundGroups({
    coalitionObjectives: playerObjectiveInfos,
    enemyObjectives: opponentObjectiveInfos,
    template: playerTemplate
  })

  const opponentGroundAssignments = assignGroundGroups({
    coalitionObjectives: opponentObjectiveInfos,
    enemyObjectives: playerObjectiveInfos,
    template: opponentTemplate
  })

  const playerGroundGroups = playerGroundAssignments.map((assignment) => ({
    id: crypto.randomUUID(),
    objectiveId: assignment.objectiveId,
    units: assignment.units
  }))

  const opponentGroundGroups = opponentGroundAssignments.map((assignment) => ({
    id: crypto.randomUUID(),
    objectiveId: assignment.objectiveId,
    units: assignment.units
  }))

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
        structures: playerStructures,
        samGroups: playerSamGroups,
        groundGroups: playerGroundGroups,
        flightGroups: []
      },
      opponent: {
        id: opponentFaction.id,
        aircraftTypes: opponentFaction.aircraftTypes,
        groundUnitTypes: opponentTemplate.groundUnitTypes,
        airdromeNames: scenario.start.opponent.airdromeNames,
        objectiveIds: objectiveAssignments.opponent ?? [],
        structures: opponentStructures,
        samGroups: opponentSamGroups,
        groundGroups: opponentGroundGroups,
        flightGroups: []
      }
    }
  }

  const result = schemas.campaign.campaign.safeParse(defaultState)
  if (!result.success) {
    console.log('result.error', result.error)
  }

  // Ensure campaigns directory exists
  const dirResult = await ensureDirectory(campaignsDir)
  if (dirResult.isErr()) {
    throw errors.FAILED_TO_WRITE_FILE({
      data: { path: campaignsDir, message: dirResult.error.message }
    })
  }

  // Save campaign to campaigns directory
  const campaignPath = path.join(campaignsDir, `${defaultState.id}.json`)
  const writeFileResult = await writeFile(campaignPath, defaultState)
  if (writeFileResult.isErr()) {
    throw errors.FAILED_TO_WRITE_FILE({
      data: { path: campaignPath, message: writeFileResult.error.message }
    })
  }

  // Set as active campaign
  await setActiveCampaignId(defaultState.id)

  return defaultState
})
