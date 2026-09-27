import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const aircraftDefinition: z.infer<typeof schemas.dcs.aircraft> = {
  chaff: 60,
  display_name: 'AV-8B N/A',
  flare: 120,
  max_fuel: 3519.423,
  max_height: 13716,
  max_speed: 990,
  name: 'AV8BNA',
  availableTasks: [
    'CAS',
    'Ground Attack',
    'Pinpoint Strike',
    'CAP',
    'DEAD',
    'SEAD',
    'Antiship Strike'
  ],
  carrierCapable: true,
  controllable: true,
  cruiseAltitude: 6096,
  cruiseSpeed: 174.72222222222,
  era: 'Modern',
  isHelicopter: false,
  AddPropAircraft: {
    ClockTime: 1,
    EWDispenserBR: 2,
    AAR_Zone3: 0,
    AAR_Zone2: 0,
    EWDispenserBL: 2,
    AAR_Zone1: 0,
    LaserCode100: 6,
    RocketBurst: 1,
    LoadWater: true,
    MountNVG: false,
    EWDispenserTBL: 2,
    GBULaserCode1: 8,
    GBULaserCode10: 8,
    LaserCode1: 8,
    EWDispenserTFL: 1,
    EWDispenserTFR: 1,
    GBULaserCode100: 6,
    LaserCode10: 8,
    EWDispenserTBR: 2
  },
  loadouts: [
    {
      task: 'default',
      name: 'default',
      displayName: 'Default',
      pylons: []
    },
    {
      task: 'CAP',
      name: 'CAP',
      displayName: 'CAP',
      pylons: [
        { CLSID: '{AGM_122_SIDEARM}', num: 1 },
        { CLSID: '{LAU_7_AGM_122_SIDEARM}', num: 2 },
        { CLSID: 'LAU_117_AGM_65F', num: 3 },
        { CLSID: '{GAU_12_Equalizer}', num: 4 },
        { CLSID: '{ALQ_164_RF_Jammer}', num: 5 },
        { CLSID: 'LAU_117_AGM_65F', num: 6 },
        { CLSID: '{LAU_7_AGM_122_SIDEARM}', num: 7 },
        { CLSID: '{AGM_122_SIDEARM}', num: 8 }
      ]
    },
    {
      task: 'CAS',
      name: 'CAS',
      displayName: 'CAS',
      pylons: [
        { CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}', num: 1 },
        { CLSID: '{DB769D48-67D7-42ED-A2BE-108D566C8B1E}', num: 2 },
        { CLSID: 'LAU_117_AGM_65F', num: 3 },
        { CLSID: '{GAU_12_Equalizer}', num: 4 },
        { CLSID: '{A111396E-D3E8-4b9c-8AC9-2432489304D5}', num: 5 },
        { CLSID: 'LAU_117_AGM_65F', num: 6 },
        { CLSID: '{DB769D48-67D7-42ED-A2BE-108D566C8B1E}', num: 7 },
        { CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}', num: 8 }
      ]
    },
    {
      task: 'Pinpoint Strike',
      name: 'Pinpoint Strike',
      displayName: 'Pinpoint Strike',
      pylons: [
        { CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}', num: 1 },
        { CLSID: '{BRU-70A_2*GBU-54_RIGHT}', num: 2 },
        { CLSID: '{BRU-70A_2*GBU-54_LEFT}', num: 3 },
        { CLSID: '{GAU_12_Equalizer}', num: 4 },
        { CLSID: '{ALQ_164_RF_Jammer}', num: 5 },
        { CLSID: '{A111396E-D3E8-4b9c-8AC9-2432489304D5}', num: 6 },
        { CLSID: '{BRU-70A_2*GBU-54_LEFT}', num: 7 },
        { CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}', num: 8 }
      ]
    },
    {
      task: 'SEAD',
      name: 'SEAD',
      displayName: 'SEAD',
      pylons: [
        { CLSID: '{AGM_122_SIDEARM}', num: 1 },
        { CLSID: '{LAU_7_AGM_122_SIDEARM}', num: 2 },
        { CLSID: 'LAU_117_AGM_65F', num: 3 },
        { CLSID: '{GAU_12_Equalizer}', num: 4 },
        { CLSID: '{ALQ_164_RF_Jammer}', num: 5 },
        { CLSID: 'LAU_117_AGM_65F', num: 6 },
        { CLSID: '{LAU_7_AGM_122_SIDEARM}', num: 7 },
        { CLSID: '{AGM_122_SIDEARM}', num: 8 }
      ]
    },
    {
      task: 'DEAD',
      name: 'DEAD',
      displayName: 'DEAD',
      pylons: [
        { CLSID: '{AGM_122_SIDEARM}', num: 1 },
        { CLSID: '{LAU_7_AGM_122_SIDEARM}', num: 2 },
        { CLSID: 'LAU_117_AGM_65F', num: 3 },
        { CLSID: '{GAU_12_Equalizer}', num: 4 },
        { CLSID: '{ALQ_164_RF_Jammer}', num: 5 },
        { CLSID: 'LAU_117_AGM_65F', num: 6 },
        { CLSID: '{LAU_7_AGM_122_SIDEARM}', num: 7 },
        { CLSID: '{AGM_122_SIDEARM}', num: 8 }
      ]
    },
    {
      task: 'Antiship Strike',
      name: 'Antiship Strike',
      displayName: 'Antiship Strike',
      pylons: [
        { CLSID: '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}', num: 1 },
        { CLSID: '{0D33DDAE-524F-4A4E-B5B8-621754FE3ADE}', num: 2 },
        { CLSID: '{DB769D48-67D7-42ED-A2BE-108D566C8B1E}', num: 3 },
        { CLSID: '{GAU_12_Equalizer}', num: 4 },
        { CLSID: '{ALQ_164_RF_Jammer}', num: 5 },
        { CLSID: '{A111396E-D3E8-4b9c-8AC9-2432489304D5}', num: 6 },
        { CLSID: '{0D33DDAE-524F-4A4E-B5B8-621754FE3ADE}', num: 7 },
        { CLSID: '{AGM_122_SIDEARM}', num: 8 }
      ]
    }
  ]
}

export default aircraftDefinition
