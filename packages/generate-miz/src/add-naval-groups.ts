import { schemas } from '@dcc/contracts'
import { err, ok, Result } from 'neverthrow'
import * as z from 'zod'

type Coalition = z.infer<typeof schemas.coalition>

const MIN_CARRIER_WIND_SPEED = 0.5

function getSpawnHeading(
  navalGroup: z.infer<typeof schemas.navalGroup>,
  mission: z.infer<typeof schemas.dcs.mission>
) {
  const surfaceWind = mission.weather.wind.atGround
  if (navalGroup.role !== 'carrier' || surfaceWind.speed < MIN_CARRIER_WIND_SPEED) {
    return navalGroup.heading
  }

  const windToHeading = (surfaceWind.dir * Math.PI) / 180
  return (windToHeading + Math.PI) % (2 * Math.PI)
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

      for (const navalGroup of coalition.navalGroups ?? []) {
        if (navalGroup.role !== 'carrier' && navalGroup.state === 'sunk') continue
        const persistedUnits =
          navalGroup.units ??
          navalGroup.unitTypes.map((type, index) => ({
            id: `${navalGroup.id}-ship-${index + 1}`,
            type,
            damage: 0,
            ammunition: navalGroup.ammunition,
            fuel: navalGroup.fuel,
            state: 'operational' as const
          }))
        const liveUnits =
          navalGroup.role === 'carrier'
            ? persistedUnits
            : persistedUnits.filter((unit) => unit.state !== 'sunk' && unit.damage < 1)
        if (liveUnits.length === 0) continue

        const groupName = `NavalGroup-${navalGroup.id}`
        const spawnHeading = getSpawnHeading(navalGroup, mission)
        const units = liveUnits.map((unit, index) => {
          const spacing = 700
          const formationBearing = spawnHeading + Math.PI / 2
          return {
            unitId: nextId(),
            name: `NavalUnit-${navalGroup.id}-${unit.id}`,
            type: unit.type,
            x: navalGroup.position.x + Math.cos(formationBearing) * index * spacing,
            y: navalGroup.position.y + Math.sin(formationBearing) * index * spacing,
            heading: spawnHeading,
            skill: 'Excellent'
          }
        })

        country.ship.group.push({
          groupId: nextId(),
          name: groupName,
          x: navalGroup.position.x,
          y: navalGroup.position.y,
          units,
          task: 'Nothing',
          route: {
            points: [
              {
                alt: 0,
                alt_type: 'BARO',
                type: 'Turning Point',
                action: 'Turning Point',
                x: navalGroup.position.x,
                y: navalGroup.position.y,
                speed: navalGroup.state === 'unloading' ? 0 : 8,
                ETA: 0,
                ETA_locked: true,
                speed_locked: true,
                task: {
                  id: 'ComboTask',
                  params: {
                    tasks:
                      navalGroup.role === 'carrier'
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
