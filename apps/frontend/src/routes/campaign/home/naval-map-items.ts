import { schemas } from '@dcc/contracts'
import * as z from 'zod'

import { tryDcsPositionToLngLat } from '@/logic/dcs-coordinates'

type NavalGroup = z.infer<typeof schemas.navalGroup>

export function createNavalGroupMapItems(
  groups: NavalGroup[],
  coalition: z.infer<typeof schemas.coalition>,
  theatreName: string
): z.infer<typeof schemas.NavalGroupMapItem>[] {
  return groups.flatMap((group) => {
    if (group.state === 'sunk') return []

    const position = tryDcsPositionToLngLat(theatreName, group.position.x, group.position.y)
    if (!position) return []

    const units =
      group.units ??
      group.unitTypes.map((type, index) => ({
        id: `${group.id}-ship-${index + 1}`,
        type,
        damage: 0,
        ammunition: group.ammunition,
        fuel: group.fuel,
        state: 'operational' as const
      }))

    return [
      {
        id: group.id,
        type: 'Naval Group' as const,
        name: group.name,
        coalition,
        role: group.role,
        state: group.state,
        heading: group.heading,
        damage: group.damage,
        fuel: group.fuel,
        ammunition: group.ammunition,
        cargo: group.cargo,
        unitTypes: group.unitTypes,
        unitCount: units.length,
        operationalUnitCount: units.filter((unit) => unit.state !== 'sunk').length,
        position
      }
    ]
  })
}
