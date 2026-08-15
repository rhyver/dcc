import { schemas } from '@dcc/contracts'
import { err, ok, Result } from 'neverthrow'
import * as z from 'zod'

type Coalition = z.infer<typeof schemas.coalition>
type NavalGroup = z.infer<typeof schemas.navalGroup>

const MIN_CARRIER_WIND_SPEED = 0.5

function getSpawnHeading(navalGroup: NavalGroup, mission: z.infer<typeof schemas.dcs.mission>) {
  const surfaceWind = mission.weather.wind.atGround
  if (navalGroup.role !== 'carrier' || surfaceWind.speed < MIN_CARRIER_WIND_SPEED) {
    return navalGroup.heading
  }

  const windToHeading = (surfaceWind.dir * Math.PI) / 180
  return (windToHeading + Math.PI) % (2 * Math.PI)
}

function getPersistentUnits(navalGroup: NavalGroup) {
  return (
    navalGroup.units ??
    navalGroup.unitTypes.map((type, index) => ({
      id: `${navalGroup.id}-ship-${index + 1}`,
      type,
      damage: 0,
      ammunition: navalGroup.ammunition,
      fuel: navalGroup.fuel,
      state: 'operational' as const
    }))
  )
}

function getLiveUnits(navalGroup: NavalGroup) {
  const units = getPersistentUnits(navalGroup)
  return navalGroup.role === 'carrier'
    ? units
    : units.filter((unit) => unit.state !== 'sunk' && unit.damage < 1)
}

export function addNavalGroups(
  mission: z.infer<typeof schemas.dcs.mission>,
  campaign: z.infer<typeof schemas.campaign.campaign>
): Result<void, Error> {
  const nextId = () => {
    mission.currentKey += 1
    return mission.currentKey
  }

  try {
    for (const [coalitionKey, coalition] of Object.entries(campaign.coalitions)) {
      const missionCoalitionKey = coalitionKey === 'player' ? 'blue' : 'red'
      const country = mission.coalition[missionCoalitionKey].country?.[0]
      if (!country) continue
      country.ship ??= { group: [] }

      const navalGroups: NavalGroup[] = coalition.navalGroups ?? []
      const navalGroupIds = new Set(navalGroups.map((group) => group.id))
      const missionGroups = new Map<string, NavalGroup[]>()
      for (const navalGroup of navalGroups) {
        const missionGroupId =
          navalGroup.missionGroupId && navalGroupIds.has(navalGroup.missionGroupId)
            ? navalGroup.missionGroupId
            : navalGroup.id
        const members = missionGroups.get(missionGroupId) ?? []
        members.push(navalGroup)
        missionGroups.set(missionGroupId, members)
      }

      for (const [missionGroupId, unsortedMembers] of missionGroups) {
        const leader =
          unsortedMembers.find((group) => group.id === missionGroupId) ?? unsortedMembers[0]
        if (!leader) continue
        const members = [leader, ...unsortedMembers.filter((group) => group !== leader)]

        const carrier = members.find((group) => group.role === 'carrier')
        const spawnHeading = getSpawnHeading(carrier ?? leader, mission)
        const formationBearing = spawnHeading + Math.PI / 2
        const units = members.flatMap((navalGroup) => {
          if (navalGroup.role !== 'carrier' && navalGroup.state === 'sunk') return []
          return getLiveUnits(navalGroup).map((unit, index) => ({
            unitId: nextId(),
            name: `NavalUnit-${navalGroup.id}-${unit.id}`,
            type: unit.type,
            x: navalGroup.position.x + Math.cos(formationBearing) * index * 700,
            y: navalGroup.position.y + Math.sin(formationBearing) * index * 700,
            heading: spawnHeading,
            skill: 'Excellent'
          }))
        })
        if (units.length === 0) continue

        country.ship.group.push({
          groupId: nextId(),
          name: `NavalGroup-${missionGroupId}`,
          x: leader.position.x,
          y: leader.position.y,
          units,
          task: 'Nothing',
          route: {
            points: [
              {
                alt: 0,
                alt_type: 'BARO',
                type: 'Turning Point',
                action: 'Turning Point',
                x: leader.position.x,
                y: leader.position.y,
                speed: leader.state === 'unloading' ? 0 : 8,
                ETA: 0,
                ETA_locked: true,
                speed_locked: true,
                task: {
                  id: 'ComboTask',
                  params: {
                    tasks: carrier
                      ? [
                          {
                            enabled: true,
                            auto: false,
                            id: 'WrappedAction',
                            number: 1,
                            params: {
                              action: { id: 'SetImmortal', params: { value: true } }
                            }
                          }
                        ]
                      : []
                  }
                }
              }
            ]
          }
        })
      }
    }
    return ok(undefined)
  } catch (cause) {
    return err(cause instanceof Error ? cause : new Error('Failed to add naval groups'))
  }
}

export function findCarrierMissionUnit(
  mission: z.infer<typeof schemas.dcs.mission>,
  coalition: Coalition,
  navalGroupId: string,
  preferredUnitTypes?: ReadonlySet<string>
) {
  const missionCoalitionKey = coalition === 'player' ? 'blue' : 'red'
  const groupName = `NavalGroup-${navalGroupId}`
  for (const country of mission.coalition[missionCoalitionKey].country ?? []) {
    const group = country.ship?.group.find((candidate) => candidate.name === groupName)
    const unit = preferredUnitTypes
      ? group?.units.find((candidate) => preferredUnitTypes.has(candidate.type))
      : group?.units[0]
    if (unit) return unit
  }
  return undefined
}
