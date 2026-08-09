import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 128,
  display_name: 'Su-22',
  flare: 128,
  max_fuel: 7200,
  max_height: 15200,
  max_speed: 1860,
  name: 'SU22',
  availableTasks: [
    'Pinpoint Strike',
    'Ground Attack',
    'CAS',
    'AFAC',
    'SEAD',
    'Runway Attack',
    'Antiship Strike'
  ],
  carrierCapable: false,
  controllable: true,
  cruiseAltitude: 3048,
  cruiseSpeed: 80,
  era: 'Late CW',
  isHelicopter: false,
  isMod: true,
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'Default',
      pylons: []
    },
    {
      task: 'Antiship Strike',
      name: 'Antiship Strike',
      displayName: 'Antiship Strike',
      pylons: []
    }
  ]
}

export default aircraftDefinition
