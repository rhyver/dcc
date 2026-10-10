import { schemas } from '@dcc/contracts'
import { afterEach, describe, expect, test } from 'vitest'
import { activeStore } from './active'

const originalCampaign = structuredClone(activeStore.getSnapshot().context)

afterEach(() => {
  activeStore.send({ type: 'loadCampaign', campaign: structuredClone(originalCampaign) })
})

describe('campaign DCS assists', () => {
  test('creates settings in an old campaign and retains them through validation and reload', () => {
    const campaign = structuredClone(originalCampaign)
    delete campaign.campaignParams
    activeStore.send({ type: 'loadCampaign', campaign })
    activeStore.send({ type: 'setDcsCheats', dcsCheats: { unlimitedFuel: true } })
    activeStore.send({ type: 'setDcsCheats', dcsCheats: { unlimitedWeapons: true } })
    activeStore.send({ type: 'setDcsCheats', dcsCheats: { immortal: true, labels: 'abbreviated' } })

    const saved = schemas.campaign.campaign.parse(
      structuredClone(activeStore.getSnapshot().context)
    )
    activeStore.send({ type: 'loadCampaign', campaign: saved })
    expect(activeStore.getSnapshot().context.campaignParams?.dcsCheats).toEqual({
      unlimitedFuel: true,
      unlimitedWeapons: true,
      immortal: true,
      labels: 'abbreviated'
    })
  })

  test('turns an assist off without resetting other assists or mission settings', () => {
    const campaign = structuredClone(originalCampaign)
    campaign.campaignParams = {
      culling: false,
      enemySkill: 'Excellent',
      dcsCheats: { unlimitedFuel: true, unlimitedWeapons: true, immortal: true, labels: 'full' }
    }
    activeStore.send({ type: 'loadCampaign', campaign })
    activeStore.send({ type: 'setDcsCheats', dcsCheats: { unlimitedFuel: false, labels: 'none' } })
    expect(activeStore.getSnapshot().context.campaignParams).toEqual({
      culling: false,
      enemySkill: 'Excellent',
      dcsCheats: { unlimitedFuel: false, unlimitedWeapons: true, immortal: true, labels: 'none' }
    })
  })

  test('accepts legacy settings and rejects invalid assists', () => {
    const campaign = structuredClone(originalCampaign)
    campaign.campaignParams = { culling: true }
    expect(schemas.campaign.campaign.parse(campaign).campaignParams?.dcsCheats).toBeUndefined()
    for (const dcsCheats of [{ labels: 'invalid' }, { unlimitedFuel: 'true' }]) {
      expect(
        schemas.campaign.campaign.safeParse({ ...campaign, campaignParams: { dcsCheats } }).success
      ).toBe(false)
    }
  })
})
