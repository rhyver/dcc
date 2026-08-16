import { aircrafts, factions } from '@dcc/data'
import { describe, expect, test } from 'vitest'

const missionLoadouts = [
  [
    'CAS',
    [
      [1, '{9BFD8C90-F7AE-4e90-833B-BFD0CED0E536}'],
      [2, 'LAU3_HE5'],
      [3, 'LAU3_HE5'],
      [4, '{0395076D-2F77-4420-9D33-087A4398130B}'],
      [5, 'LAU3_HE5'],
      [6, 'LAU3_HE5'],
      [7, '{9BFD8C90-F7AE-4e90-833B-BFD0CED0E536}']
    ]
  ],
  [
    'Pinpoint Strike',
    [
      [1, '{9BFD8C90-F7AE-4e90-833B-BFD0CED0E536}'],
      [2, '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}'],
      [3, '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}'],
      [4, '{0395076D-2F77-4420-9D33-087A4398130B}'],
      [5, '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}'],
      [6, '{BCE4E030-38E9-423E-98ED-24BE3DA87C32}'],
      [7, '{9BFD8C90-F7AE-4e90-833B-BFD0CED0E536}']
    ]
  ]
] as const

describe('mission-derived F-5E loadouts', () => {
  test.each(missionLoadouts)('has the %s loadout', (task, pylons) => {
    expect(aircrafts.f_5e_3.availableTasks).toContain(task)
    expect(aircrafts.f_5e_3.loadouts.find((loadout) => loadout.task === task)?.pylons).toEqual(
      pylons.map(([num, CLSID]) => ({ CLSID, num }))
    )
  })

  test.each(['argentina-1982-official', 'usa-1977', 'usa-vietnam'])(
    '%s exposes the F-5E for CAS and pinpoint strike',
    (id) => {
      const aircraftTypes = factions.find((faction) => faction.id === id)?.aircraftTypes

      expect(aircraftTypes?.CAS).toContain('F-5E-3')
      expect(aircraftTypes?.['Pinpoint Strike']).toContain('F-5E-3')
    }
  )
})
