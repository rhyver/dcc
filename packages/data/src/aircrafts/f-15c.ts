import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 120,
  display_name: 'F-15C',
  flare: 60,
  max_fuel: 6103,
  max_height: 19700,
  max_speed: 2650,
  name: 'F-15C',
  availableTasks: ['CAP', 'Fighter Sweep', 'Escort'],
  controllable: true,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 251.80555555556,
  era: 'Late CW',
  carrierCapable: false,
  loadouts: [
    {
      task: 'default',
      name: 'AIM-120',
      displayName: 'AIM-120',
      pylons: [
        {
          CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
          num: 1
        },
        {
          CLSID: '{E1F29B21-F291-4589-9FD8-3272EEC69506}',
          num: 2
        },
        {
          CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
          num: 3
        },
        {
          CLSID: '{C8E06185-7CD6-4C90-959F-044679E90751}',
          num: 4
        },
        {
          CLSID: '{C8E06185-7CD6-4C90-959F-044679E90751}',
          num: 5
        },
        {
          CLSID: '{E1F29B21-F291-4589-9FD8-3272EEC69506}',
          num: 6
        },
        {
          CLSID: '{C8E06185-7CD6-4C90-959F-044679E90751}',
          num: 7
        },
        {
          CLSID: '{C8E06185-7CD6-4C90-959F-044679E90751}',
          num: 8
        },
        {
          CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
          num: 9
        },
        {
          CLSID: '{E1F29B21-F291-4589-9FD8-3272EEC69506}',
          num: 10
        },
        {
          CLSID: '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}',
          num: 11
        }
      ]
    }
  ]
}

export default aircraftDefinition
