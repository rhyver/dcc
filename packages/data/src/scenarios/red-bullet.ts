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
    '<p>In May 2004, the conflict between Russia-Georgia escalated into a full-scale military conflict, with Russia military forces launching an invasion of Georgia.</p><p>The United States, along with several other Western nations, came to the aid of Georgia during the conflict. The U.S. provided diplomatic, economic, and military support to Georgia, including the deployment of military forces.</p><p>Main goal for the NATO coalition is the <strong>recapture of the Enguri Dam</strong>. To limit the damage to the Geogian infrastructure</p>',
  start: {
    player: {
      airdromeNames: ['Kobuleti'],
      carrierObjectiveId: 'Alpha',
      objectiveIds: ['Maharadze', 'Hidmagala']
    },
    opponent: {
      airdromeNames: ['Sukhumi-Babushara', 'Nalchik'],
      objectiveIds: ['Sukhumi-Babushara', 'Enguri Dam', 'Sarakoni', 'Bataria']
    }
  }
}
