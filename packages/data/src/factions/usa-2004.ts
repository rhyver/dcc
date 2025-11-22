import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export const USA2004: z.infer<typeof schemas.faction> = {
  id: 'usa-2004',
  countryName: 'USA',
  name: 'USA',
  year: 2004,
  playable: true,
  aircraftTypes: {
    DEAD: [],
    AWACS: [],
    CAP: ['F-16C_50'],
    Escort: ['F-16C_50'],
    'Pinpoint Strike': ['F-16C_50', 'F-15ESE'],
    CAS: ['A-10C_2', 'AH-64D_BLK_II'],
    CSAR: ['UH-1H'],
    'Air Assault': ['UH-1H'],
    SEAD: ['F-16C_50'],
    'Antiship Strike': [],
    'Fighter Sweep': [],
    'Ground Attack': ['A-10C_2', 'AH-64D_BLK_II'],
    'Runway Attack': [],
    Transport: [],
    Refueling: [],
    RescueHelo: [],
    AFAC: [],
    Intercept: []
  },
  color: 'blue',
  templateName: 'USA - Modern'
}
