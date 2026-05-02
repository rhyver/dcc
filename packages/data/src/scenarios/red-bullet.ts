import { schemas } from '@dcc/contracts'
import * as z from 'zod'

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
  }
}
