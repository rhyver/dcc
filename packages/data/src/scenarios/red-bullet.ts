import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { carrierStrikeGroup, radians } from './naval-groups'

export const RedBullet: z.infer<typeof schemas.scenario> = {
  theatreName: 'Caucasus',
  id: 'red-bullet',
  name: 'Red Bullet',
  available: true,
  date: new Date('2022-06-01T09:00:00Z'),
  era: 'Modern',
  briefing:
    'Russian forces have seized key crossings in western Georgia, including the Enguri Dam, and are using the valley to anchor their advance toward the coast.\n\nNATO forces staging from Kobuleti must break through the coastal front, disrupt Russian air defenses, and recapture the dam before the region is cut off. The operation depends on keeping Georgian infrastructure intact while pushing hostile ground forces back across the river.',
  goal: {
    coalition: 'player',
    objectiveIds: ['Enguri Dam']
  },
  sideSelectable: true,
  opponentBriefing:
    'Russian forces hold the Enguri Dam and the crossings of western Georgia, but NATO has landed a bridgehead around Kobuleti and is massing to break out along the coast.\n\nOperating from Sukhumi-Babushara and Nalchik, Russian air and ground forces must hold the river line, blunt the NATO air campaign, and drive the coalition out of Maharadze and Hidmagala before reinforcements turn the bridgehead into a front.',
  opponentGoal: {
    coalition: 'player',
    objectiveIds: ['Maharadze', 'Hidmagala']
  },
  start: {
    player: {
      airdromeNames: ['Kobuleti'],
      carrierObjectiveId: 'Alpha',
      groundGroupSpawnMultiplier: 2,
      objectiveIds: ['Maharadze', 'Hidmagala']
    },
    opponent: {
      airdromeNames: ['Sukhumi-Babushara', 'Nalchik'],
      groundGroupSpawnMultiplier: 1,
      objectiveIds: ['Sukhumi-Babushara', 'Enguri Dam', 'Sarakoni', 'Bataria']
    }
  },
  navalGroups: {
    // Sails from the theatre's Alpha ship objective, which the campaign excludes as a capture target.
    player: carrierStrikeGroup({ x: -305_484, y: 577_991 }, radians(0)),
    opponent: []
  }
}
