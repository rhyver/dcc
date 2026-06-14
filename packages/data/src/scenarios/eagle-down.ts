import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export const EagleDown: z.infer<typeof schemas.scenario> = {
  theatreName: 'PersianGulf',
  id: 'eagle-down',
  name: 'Eagle Down',
  author: 'Dionysus',
  available: true,
  date: new Date('2022-06-01T09:00:00Z'),
  era: 'Modern',
  briefing:
    'US and coalition forces operating from the western Gulf must break through hostile positions along the Strait of Hormuz and push inland.\n\nThe campaign depends on establishing a foothold at Bunji-ye-Maski, suppressing enemy airfields and coastal defenses, and opening the route toward Sayeh Khvosh.',
  goal: {
    coalition: 'player',
    objectiveIds: ['Sayeh Khvosh']
  },
  start: {
    player: {
      airdromeNames: ['Sharjah Intl'],
      carrierObjectiveId: 'Alpha',
      groundGroupSpawnMultiplier: 2,
      objectiveIds: ['Bunji-ye-Maski']
    },
    opponent: {
      airdromeNames: ['Bandar Abbas Intl', 'Lar', 'Kerman'],
      groundGroupSpawnMultiplier: 1,
      objectiveIds: ['Seerik', 'Chahestan', 'Bandar-e Lengeh', 'Bandar-e-Jask']
    }
  }
}
