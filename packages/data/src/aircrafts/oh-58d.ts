import { schemas } from '@dcc/contracts'
import * as z from 'zod'

// Payloads and aircraft properties from kiowa loadout.miz.
const attackPylons = [
  { CLSID: 'OH58D_AGM_114_L', num: 1 },
  { CLSID: 'OH58D_AGM_114_R', num: 5 }
]

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 0,
  display_name: 'OH-58D Kiowa Warrior',
  flare: 30,
  max_fuel: 333.69,
  max_height: 4267,
  max_speed: 230,
  name: 'OH58D',
  availableTasks: ['CSAR', 'CAS', 'Ground Attack'],
  controllable: true,
  isHelicopter: true,
  cruiseAltitude: 150,
  cruiseSpeed: 46.25,
  era: 'Late CW',
  carrierCapable: true,
  AddPropAircraft: {
    'MMS removal': false,
    'Remove doors': true,
    'Rapid Deployment Gear': false,
    ALQ144: false,
    PDU: false,
    tacNet: 1
  },
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'Default / CSAR',
      pylons: []
    },
    {
      task: 'CAS',
      name: 'cas',
      displayName: 'CAS - Hellfires',
      pylons: attackPylons
    },
    {
      task: 'Ground Attack',
      name: 'ground-attack',
      displayName: 'Ground Attack - Hellfires',
      pylons: attackPylons
    }
  ]
}

export default aircraftDefinition
