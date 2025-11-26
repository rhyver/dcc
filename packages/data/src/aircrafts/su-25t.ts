import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 128,
  display_name: 'Su-25T',
  flare: 128,
  max_fuel: 3790,
  max_height: 7000,
  max_speed: 950,
  name: 'Su-25T',
  availableTasks: ['CAS', 'Ground Attack', 'Pinpoint Strike', 'SEAD', 'DEAD'],
  controllable: true,
  isHelicopter: false,
  cruiseAltitude: 6096,
  cruiseSpeed: 174.72222222222,
  era: 'Late CW',
  carrierCapable: false,
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'default',
      pylons: [
        { CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82D}', num: 1 },
        { CLSID: '{CBC29BFE-3D24-4C64-B81D-941239D12249}', num: 2 },
        { CLSID: '{79D73885-0801-45a9-917F-C90FE1CE3DFC}', num: 3 },
        { CLSID: '{F789E86A-EE2E-4E6B-B81E-D5E5F903B6ED}', num: 4 },
        { CLSID: '{E92CBFE5-C153-11d8-9897-000476191836}', num: 5 },
        { CLSID: '{B1EF6B0E-3D91-4047-A7A5-A99E7D8B4A8B}', num: 6 },
        { CLSID: '{E92CBFE5-C153-11d8-9897-000476191836}', num: 7 },
        { CLSID: '{F789E86A-EE2E-4E6B-B81E-D5E5F903B6ED}', num: 8 },
        { CLSID: '{79D73885-0801-45a9-917F-C90FE1CE3DFC}', num: 9 },
        { CLSID: '{CBC29BFE-3D24-4C64-B81D-941239D12249}', num: 10 },
        { CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82C}', num: 11 }
      ]
    },
    {
      task: 'Pinpoint Strike',
      name: 'Strike',
      displayName: 'Strike',
      pylons: [
        {
          CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82D}'
        },
        {
          CLSID: '{CBC29BFE-3D24-4C64-B81D-941239D12249}'
        },
        {
          CLSID: '{79D73885-0801-45a9-917F-C90FE1CE3DFC}'
        },
        {
          CLSID: '{79D73885-0801-45a9-917F-C90FE1CE3DFC}'
        },
        {
          CLSID: '{D4A8D9B9-5C45-42e7-BBD2-0E54F8308432}'
        },
        {
          CLSID: '{B1EF6B0E-3D91-4047-A7A5-A99E7D8B4A8B}'
        },
        {
          CLSID: '{D4A8D9B9-5C45-42e7-BBD2-0E54F8308432}'
        },
        {
          CLSID: '{79D73885-0801-45a9-917F-C90FE1CE3DFC}'
        },
        {
          CLSID: '{79D73885-0801-45a9-917F-C90FE1CE3DFC}'
        },
        {
          CLSID: '{CBC29BFE-3D24-4C64-B81D-941239D12249}'
        },
        {
          CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82C}'
        }
      ]
    },
    {
      task: 'DEAD',
      name: 'DEAD',
      displayName: 'DEAD',
      pylons: [
        {
          CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82D}'
        },
        {
          CLSID: '{CBC29BFE-3D24-4C64-B81D-941239D12249}'
        },
        {
          CLSID: '{79D73885-0801-45a9-917F-C90FE1CE3DFC}'
        },
        {
          CLSID: '{752AF1D2-EBCC-4bd7-A1E7-2357F5601C70}'
        },
        {
          CLSID: '{B5CA9846-776E-4230-B4FD-8BCC9BFB1676}'
        },
        {
          CLSID: '{0519A264-0AB6-11d6-9193-00A0249B6F00}'
        },
        {
          CLSID: '{B5CA9846-776E-4230-B4FD-8BCC9BFB1676}'
        },
        {
          CLSID: '{752AF1D2-EBCC-4bd7-A1E7-2357F5601C70}'
        },
        {
          CLSID: '{79D73885-0801-45a9-917F-C90FE1CE3DFC}'
        },
        {
          CLSID: '{CBC29BFE-3D24-4C64-B81D-941239D12249}'
        },
        {
          CLSID: '{44EE8698-89F9-48EE-AF36-5FD31896A82C}'
        }
      ]
    }
  ]
}

export default aircraftDefinition
