import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export const USA2004: z.infer<typeof schemas.faction> = {
  id: 'usa-2004',
  countryName: 'USA',
  name: 'USA',
  year: 2004,
  playable: true,
  aircraftTypes: {
    DEAD: ['F-16C_50'],
    AWACS: ['E-3A'],
    CAP: ['F-16C_50'],
    Escort: ['F-16C_50'],
    'Pinpoint Strike': ['F-16C_50', 'AV8BNA'],
    'Strategic Strike': ['B-52H', 'B-1B'],
    CAS: ['F-16C_50', 'AV8BNA', 'OH58D'],
    CSAR: ['UH-1H', 'OH58D'],
    CASEVAC: ['UH-1H', 'CH-47Fbl1'],
    'Troop Extraction': ['UH-1H', 'CH-47Fbl1'],
    'Air Assault': ['UH-1H'],
    SEAD: ['F-16C_50'],
    'Antiship Strike': ['AV8BNA'],
    'Fighter Sweep': [],
    'Ground Attack': ['F-16C_50', 'OH58D'],
    'Runway Attack': [],
    Transport: ['C-130J-30', 'CH-47Fbl1'],
    Refueling: [],
    RescueHelo: [],
    AFAC: [],
    Intercept: []
  },
  color: 'blue',
  templateName: 'USA - Modern'
}
