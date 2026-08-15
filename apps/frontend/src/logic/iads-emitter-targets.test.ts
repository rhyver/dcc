import { schemas } from '@dcc/contracts'
import { describe, expect, test } from 'vitest'
import type * as z from 'zod'

import { getIadsEmitterTargets } from './iads-emitter-targets'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type CoalitionData = Campaign['coalitions']['player']

function createCoalition(id: 'player' | 'opponent'): CoalitionData {
  return {
    id,
    aircraftTypes: Object.fromEntries(
      schemas.task.options.map((task) => [task, [] as string[]])
    ) as CoalitionData['aircraftTypes'],
    groundUnitTypes: Object.fromEntries(
      schemas.groundUnitType.options.map((type) => [type, [] as string[]])
    ) as CoalitionData['groundUnitTypes'],
    airdromeNames: [],
    objectiveIds: [],
    structures: [],
    samGroups: [],
    ewrGroups: [],
    groundGroups: [],
    flightGroups: [],
    packages: []
  }
}

function createCampaign(): Campaign {
  const campaign = {
    version: 'test',
    id: 'campaign-1',
    name: 'Emitter targets',
    createdAt: new Date('2026-01-01T12:00:00.000Z'),
    updatedAt: new Date('2026-01-01T12:00:00.000Z'),
    time: new Date('2026-01-01T12:00:00.000Z'),
    timeMultiplier: 1,
    logs: [],
    scenarioId: 'test',
    coalitions: {
      player: createCoalition('player'),
      opponent: createCoalition('opponent')
    }
  } satisfies Campaign

  campaign.coalitions.opponent.samGroups = [
    { id: 'active-sam', type: 'SA-6', objectiveId: 'Active SAM' },
    { id: 'suppressed-sam', type: 'SA-6', objectiveId: 'Suppressed SAM', suppressed: true },
    { id: 'destroyed-sam', type: 'SA-6', objectiveId: 'Destroyed SAM', destroyed: true }
  ]
  campaign.coalitions.opponent.ewrGroups = [
    {
      id: 'active-ewr',
      type: '55G6 EWR',
      objectiveId: 'Active EWR',
      position: { x: 30_000, y: 0 }
    },
    {
      id: 'suppressed-ewr',
      type: '55G6 EWR',
      objectiveId: 'Suppressed EWR',
      position: { x: 40_000, y: 0 },
      suppressed: true
    },
    {
      id: 'destroyed-ewr',
      type: '55G6 EWR',
      objectiveId: 'Destroyed EWR',
      position: { x: 50_000, y: 0 },
      destroyed: true
    }
  ]
  return campaign
}

const theatre = {
  objectives: [
    { name: 'Active SAM', position: { x: 0, y: 0 } },
    { name: 'Suppressed SAM', position: { x: 10_000, y: 0 } },
    { name: 'Destroyed SAM', position: { x: 20_000, y: 0 } }
  ]
} as unknown as z.infer<typeof schemas.theatre>

describe('getIadsEmitterTargets', () => {
  test('offers only emitting SAM and EWR sites to SEAD', () => {
    const targets = getIadsEmitterTargets(createCampaign(), 'opponent', theatre, 'SEAD')

    expect(targets.map((target) => target.target.id)).toEqual(['active-sam', 'active-ewr'])
  })

  test('offers active and suppressed sites to DEAD but excludes destroyed sites', () => {
    const targets = getIadsEmitterTargets(createCampaign(), 'opponent', theatre, 'DEAD')

    expect(targets.map((target) => target.target.id)).toEqual([
      'active-sam',
      'suppressed-sam',
      'active-ewr',
      'suppressed-ewr'
    ])
  })
})
