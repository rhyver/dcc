import { schemas } from '@dcc/contracts'
import * as z from 'zod'

export const RUSSIA1984: z.infer<typeof schemas.faction> = {
  id: 'russia-1984',
  countryName: 'Russia',
  name: 'Russia',
  year: 1984,
  playable: true,
  aircraftTypes: {
    DEAD: ['Su-17M4'],
    AWACS: ['A-50'],
    CAP: ['MiG-29A', 'MiG-29 Fulcrum', 'Su-27'],
    Escort: ['MiG-29A', 'MiG-29 Fulcrum', 'Su-27'],
    'Pinpoint Strike': ['Su-25', 'Su-27'],
    'Strategic Strike': [],
    CAS: ['Su-25', 'MiG-29 Fulcrum'],
    CSAR: ['Mi-8MT'],
    CASEVAC: ['Mi-8MT'],
    'Troop Extraction': ['Mi-8MT'],
    'Air Assault': ['Mi-8MT'],
    SEAD: ['Su-17M4'],
    'Antiship Strike': ['MiG-29 Fulcrum'],
    'Fighter Sweep': ['MiG-29A', 'MiG-29 Fulcrum', 'Su-27'],
    'Ground Attack': ['Su-25', 'Su-17M4', 'MiG-29 Fulcrum'],
    'Runway Attack': ['Su-17M4', 'Su-27', 'MiG-29 Fulcrum'],
    Transport: ['Mi-8MT'],
    Refueling: [],
    RescueHelo: ['Mi-8MT'],
    AFAC: [],
    Intercept: ['MiG-29A', 'MiG-29 Fulcrum', 'Su-27']
  },
  color: 'red',
  templateName: 'Russia - Modern'
}
