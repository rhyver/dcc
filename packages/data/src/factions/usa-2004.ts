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
    'Pinpoint Strike': ['F-16C_50'],
    CAS: ['F-16C_50'],
    CSAR: ['UH-1H'],
    'Air Assault': ['UH-1H'],
    SEAD: ['F-16C_50'],
    'Antiship Strike': [],
    'Fighter Sweep': [],
    'Ground Attack': ['F-16C_50'],
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
