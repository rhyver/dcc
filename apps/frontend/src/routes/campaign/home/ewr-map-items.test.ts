import { describe, expect, test } from 'vitest'

import { createEwrMapItems } from './ewr-map-items'

describe('createEwrMapItems', () => {
  test('renders persistent operational and destroyed radar state', () => {
    const items = createEwrMapItems(
      [
        {
          id: 'ewr-live',
          type: '55G6 EWR',
          objectiveId: 'Stanley Airport',
          position: { x: 87_610, y: 184_267 }
        },
        {
          id: 'ewr-destroyed',
          type: '55G6 EWR',
          objectiveId: 'Fox Bay',
          position: { x: 87_610, y: 184_267 },
          destroyed: true
        }
      ],
      'opponent',
      'SouthAtlantic'
    )

    expect(items).toEqual([
      expect.objectContaining({ id: 'ewr-live', type: 'EWR', active: true }),
      expect.objectContaining({ id: 'ewr-destroyed', type: 'EWR', active: false })
    ])
  })
})
