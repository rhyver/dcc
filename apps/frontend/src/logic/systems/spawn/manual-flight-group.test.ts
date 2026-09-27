import { schemas } from '@dcc/contracts'
import { theatres } from '@dcc/data'
import type * as z from 'zod'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { canCreateManualFlightGroup, createManualFlightGroup } from './manual-flight-group'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type CoalitionData = Campaign['coalitions']['player']

const campaignTime = new Date('2026-01-01T12:00:00.000Z')

afterEach(() => {
  vi.restoreAllMocks()
})

function createAircraftTypes(): CoalitionData['aircraftTypes'] {
  const aircraftTypes = Object.fromEntries(
    schemas.task.options.map((task) => [task, [] as string[]])
  ) as CoalitionData['aircraftTypes']

  aircraftTypes['Pinpoint Strike'] = ['F-16C_50']
  aircraftTypes.CAS = ['A-10C']
  aircraftTypes.DEAD = ['FA-18C_hornet']
  aircraftTypes.SEAD = ['F-16C_50']
  return aircraftTypes
}

function createCoalition(id: 'player' | 'opponent'): CoalitionData {
  const caucasus = theatres.find((theatre) => theatre.name === 'Caucasus')!
  const objectivePosition = (name: string) =>
    caucasus.objectives.find((objective) => objective.name === name)!.position

  return {
    id,
    aircraftTypes: createAircraftTypes(),
    groundUnitTypes: Object.fromEntries(
      schemas.groundUnitType.options.map((type) => [type, [] as string[]])
    ) as CoalitionData['groundUnitTypes'],
    airdromeNames: id === 'player' ? ['Kobuleti'] : [],
    objectiveIds: id === 'player' ? ['Kobuleti'] : ['Zugdidi', 'Enguri Dam'],
    structures:
      id === 'opponent'
        ? ['Zugdidi', 'Enguri Dam'].map((objectiveId, index) => ({
            id: `structure-${index + 1}`,
            type: 'Ammo Depot' as const,
            objectiveId,
            position: objectivePosition(objectiveId),
            name: 'Ammo Depot',
            resources: 0,
            buildings: [{ offset: { x: 0, y: 0 }, type: 'Workshop A', alive: true }]
          }))
        : [],
    samGroups: id === 'opponent' ? [{ id: 'sam-1', type: 'SA-6', objectiveId: 'Zugdidi' }] : [],
    groundGroups:
      id === 'opponent'
        ? [
            {
              id: 'ground-1',
              objectiveId: 'Zugdidi',
              position: objectivePosition('Zugdidi'),
              state: 'idle' as const,
              units: [{ name: 'Infantry AK', count: 5 }]
            }
          ]
        : [],
    flightGroups: [],
    packages: [],
    supplyNodes: {}
  }
}

function createCampaign(): Campaign {
  return {
    version: 'test',
    id: 'campaign-1',
    name: 'Test Campaign',
    createdAt: campaignTime,
    updatedAt: campaignTime,
    time: campaignTime,
    timeMultiplier: 1,
    logs: [],
    scenarioId: 'red-bullet',
    coalitions: {
      player: createCoalition('player'),
      opponent: createCoalition('opponent')
    }
  }
}

describe('targeted manual flight groups', () => {
  test('creates a pinpoint strike for the selected structure', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign()

    const flightGroupId = createManualFlightGroup(campaign, 'player', 'Pinpoint Strike', {
      id: 'structure-2'
    })

    const flightGroup = campaign.coalitions.player.flightGroups.find(
      (group) => group.id === flightGroupId
    )
    expect(flightGroup?.target?.id).toBe('structure-2')
    expect(
      canCreateManualFlightGroup(campaign, 'player', 'Pinpoint Strike', {
        id: 'structure-2'
      })
    ).toBe(false)
  })

  test('creates CAS for the selected viable ground group', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign()

    createManualFlightGroup(campaign, 'player', 'CAS', { id: 'ground-1' })

    expect(campaign.coalitions.player.flightGroups[0]?.target?.id).toBe('ground-1')
  })

  test('creates DEAD for the selected emitter and rejects unrelated tasks', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const campaign = createCampaign()

    expect(canCreateManualFlightGroup(campaign, 'player', 'CAS', { id: 'sam-1' })).toBe(false)
    createManualFlightGroup(campaign, 'player', 'DEAD', { id: 'sam-1' })

    expect(campaign.coalitions.player.flightGroups[0]?.target?.id).toBe('sam-1')
  })
})
