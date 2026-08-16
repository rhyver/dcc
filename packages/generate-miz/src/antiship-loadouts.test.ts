import { aircrafts, factions } from '@dcc/data'
import { describe, expect, test } from 'vitest'

const antishipLoadouts = [
  [
    aircrafts.av8bna,
    [
      [1, '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}'],
      [2, '{0D33DDAE-524F-4A4E-B5B8-621754FE3ADE}'],
      [3, '{DB769D48-67D7-42ED-A2BE-108D566C8B1E}'],
      [4, '{GAU_12_Equalizer}'],
      [5, '{ALQ_164_RF_Jammer}'],
      [6, '{A111396E-D3E8-4b9c-8AC9-2432489304D5}'],
      [7, '{0D33DDAE-524F-4A4E-B5B8-621754FE3ADE}'],
      [8, '{AGM_122_SIDEARM}']
    ]
  ],
  [
    aircrafts.fa_18c_hornet,
    [
      [1, '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}'],
      [2, '{AGM_84D}'],
      [3, '{AGM_84D}'],
      [4, '{AN_ASQ_228}'],
      [5, '{FPU_8A_FUEL_TANK}'],
      [6, '{40EF17B7-F508-45de-8566-6FFECC0C1AB8}'],
      [7, '{AGM_84D}'],
      [8, '{AGM_84D}'],
      [9, '{6CEB49FC-DED8-4DED-B053-E1F033FF72D3}']
    ]
  ],
  [
    aircrafts.ajs37,
    [
      [2, '{Rb15_HB}'],
      [3, '{Robot74}'],
      [4, '{VIGGEN_X-TANK}'],
      [5, '{Robot74}'],
      [6, '{Rb15_HB}']
    ]
  ],
  [
    aircrafts.f_4e_45mc,
    [
      [1, '{51F9AAE5-964F-4D21-83FB-502E3BFE5F8A}'],
      [2, '<CLEAN>'],
      [3, '{AGM_62_I}'],
      [4, '<CLEAN>'],
      [5, '{HB_F4E_AIM-7E-2}'],
      [6, '{HB_PAVE_SPIKE_FAST_ON_ADAPTER_IN_AERO7}'],
      [7, '{F4_SARGENT_TANK_600_GAL}'],
      [8, '{HB_F4E_AIM-7E-2}'],
      [9, '{HB_F4E_AIM-7E-2}'],
      [10, '<CLEAN>'],
      [11, '{AGM_62_I}'],
      [12, '<CLEAN>'],
      [13, '{51F9AAE5-964F-4D21-83FB-502E3BFE5F8A}'],
      [14, '{HB_ALE_40_30_60}']
    ]
  ],
  [
    aircrafts.f_5e_3,
    [
      [1, '{AIM-9P5}'],
      [2, '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}'],
      [3, '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}'],
      [4, '{PTB-150GAL}'],
      [5, '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}'],
      [6, '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}'],
      [7, '{AIM-9P5}']
    ]
  ],
  [
    aircrafts.jf_17,
    [
      [1, 'DIS_PL-5EII'],
      [2, 'DIS_C-701IR'],
      [3, 'DIS_C-802AK'],
      [4, 'DIS_TANK800'],
      [5, 'DIS_C-802AK'],
      [6, 'DIS_C-701IR'],
      [7, 'DIS_PL-5EII']
    ]
  ],
  [aircrafts.su_22m4, []]
] as const

describe('mission-derived anti-ship aircraft data', () => {
  test.each(antishipLoadouts)('$display_name has the supplied loadout', (aircraft, pylons) => {
    expect(aircraft.availableTasks).toContain('Antiship Strike')
    expect(aircraft.loadouts.find(({ task }) => task === 'Antiship Strike')?.pylons).toEqual(
      pylons.map(([num, CLSID]) => ({ CLSID, num }))
    )
  })

  test.each([
    ['argentina-1982-official', ['AJS37', 'F-5E-3']],
    ['sweden-1970', ['AJS37']],
    ['us-navy-1987', ['AV8BNA', 'FA-18C_hornet']],
    ['usa-1977', ['F-4E-45MC', 'F-5E-3']],
    ['usa-2004', ['AV8BNA']],
    ['usa-vietnam', ['F-4E-45MC', 'F-5E-3']]
  ])('%s exposes its anti-ship aircraft', (id, expectedAircraft) => {
    expect(factions.find((faction) => faction.id === id)?.aircraftTypes['Antiship Strike']).toEqual(
      expectedAircraft
    )
  })
})
