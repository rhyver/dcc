import { schemas } from '@dcc/contracts'
import { describe, expect, test } from 'vitest'

import { activeStore } from './active'

const originalCampaign = structuredClone(activeStore.getSnapshot().context)

describe('campaign enemy AI skill', () => {
  test.each(schemas.campaign.enemySkill.options)(
    'retains %s through validation and reload',
    (skill) => {
      const legacyCampaign = structuredClone(originalCampaign)
      delete legacyCampaign.campaignParams
      activeStore.send({ type: 'loadCampaign', campaign: legacyCampaign })
      activeStore.send({ type: 'setEnemySkill', enemySkill: skill })

      const campaign = schemas.campaign.campaign.parse(
        structuredClone(activeStore.getSnapshot().context)
      )
      activeStore.send({ type: 'loadCampaign', campaign })

      expect(activeStore.getSnapshot().context.campaignParams?.enemySkill).toBe(skill)
    }
  )

  test('restores Default without removing other mission settings', () => {
    const campaign = structuredClone(originalCampaign)
    campaign.campaignParams = { culling: false, enemySkill: 'Excellent' }
    activeStore.send({ type: 'loadCampaign', campaign })
    activeStore.send({ type: 'setEnemySkill', enemySkill: undefined })

    const saved = schemas.campaign.campaign.parse(activeStore.getSnapshot().context)
    activeStore.send({ type: 'loadCampaign', campaign: saved })

    expect(activeStore.getSnapshot().context.campaignParams).toEqual({ culling: false })
  })

  test('accepts old campaigns and rejects unsupported skill values', () => {
    const campaign = structuredClone(originalCampaign)
    delete campaign.campaignParams
    expect(schemas.campaign.campaign.parse(campaign).campaignParams).toBeUndefined()
    expect(
      schemas.campaign.campaign.safeParse({
        ...campaign,
        campaignParams: { enemySkill: 'Invalid' }
      }).success
    ).toBe(false)
  })
})
