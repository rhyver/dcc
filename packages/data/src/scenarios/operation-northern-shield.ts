import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export const OperationNorthernShield: z.infer<typeof schemas.scenario> = {
  theatreName: 'Syria',
  id: 'operation-northern-shield',
  name: 'Operation Northern Shield',
  available: true,
  date: new Date('1972-09-20T09:00:00Z'),
  era: 'Late CW',
  briefing:
    "In the aftermath of Syria's invasion of Lebanon, Israel has launched a military campaign to recapture territory and reestablish control.\n\nThe Israel Defense Forces must push north from Ramat David, secure the coastal corridor, and capture Hama Center to create a buffer zone along Israel's northern border.",
  goal: {
    coalition: 'player',
    objectiveIds: ['Hama Center']
  },
  start: {
    player: {
      airdromeNames: ['Ramat David'],
      carrierObjectiveId: 'Alpha',
      groundGroupSpawnMultiplier: 2,
      objectiveIds: ['Migdal HaEmek', 'Haifa']
    },
    opponent: {
      airdromeNames: [
        'Beirut-Rafic Hariri',
        'Damascus',
        'King Hussein Air College',
        'Al Qusayr',
        'Hama'
      ],
      groundGroupSpawnMultiplier: 1,
      objectiveIds: ['El Taebah', 'Al Harah', 'Aadloun']
    }
  }
}
