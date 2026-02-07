import { schemas } from '@dcc/contracts'
import { samTemplates } from '@dcc/data'
import { ok, Result } from 'neverthrow'
import * as z from 'zod'

/**
 * Arrange units in a circle around a center point.
 * The first unit (typically the radar/command unit) is placed at center;
 * remaining units fan out at increasing radius.
 */
function arrangeUnits(
  center: { x: number; y: number },
  count: number,
  spacing: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  if (count === 0) return positions

  // First unit at center
  positions.push({ x: center.x, y: center.y })

  // Remaining units in a circle
  for (let i = 1; i < count; i++) {
    const angle = ((2 * Math.PI) / (count - 1)) * (i - 1)
    positions.push({
      x: center.x + Math.cos(angle) * spacing,
      y: center.y + Math.sin(angle) * spacing
    })
  }

  return positions
}

export function addGroundGroups(
  mission: z.infer<typeof schemas.dcs.mission>,
  campaign: z.infer<typeof schemas.campaign.campaign>,
  theatre: z.infer<typeof schemas.theatre>
): Result<void, Error> {
  const nextId = () => {
    mission.currentKey += 1
    return mission.currentKey
  }

  for (const [key, value] of Object.entries(campaign.coalitions)) {
    const missionCoalitionKey = key === 'player' ? 'blue' : key === 'opponent' ? 'red' : 'neutrals'

    const countryList = mission.coalition[missionCoalitionKey].country
    const country = countryList?.[0]
    if (country == null) continue

    if (!country.vehicle) {
      country.vehicle = { group: [] }
    }

    // --- SAM Groups ---
    const samGroups = value.samGroups
    if (samGroups && samGroups.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `Adding ${samGroups.length} SAM groups for coalition ${missionCoalitionKey} (${key})`
      )

      for (const sam of samGroups) {
        if (sam.destroyed) continue

        const objective = theatre.objectives.find((o) => o.name === sam.objectiveId)
        if (!objective) continue

        const template = samTemplates[sam.type]
        if (!template) continue

        const groupId = nextId()
        const groupName = `SAM ${sam.type}-${groupId}`
        const positions = arrangeUnits(objective.position, template.units.length, 50)

        const units = template.units.map((unitType, index) => {
          const pos = positions[index] ?? objective.position
          return {
            unitId: nextId(),
            name: `${groupName}-${index + 1}`,
            x: pos.x,
            y: pos.y,
            type: unitType,
            heading: 0,
            skill: 'High'
          }
        })

        const firstUnit = units[0]
        if (!firstUnit) continue

        country.vehicle.group.push({
          groupId: groupId,
          name: groupName,
          units: units,
          x: firstUnit.x,
          y: firstUnit.y,
          hidden: false,
          start_time: 0,
          route: {
            points: [
              {
                alt: 0,
                alt_type: 'BARO',
                type: 'Turning Point',
                y: firstUnit.y,
                x: firstUnit.x,
                speed: 0,
                action: 'Off Road',
                ETA: 0,
                ETA_locked: true,
                speed_locked: true,
                formation_template: ''
              }
            ]
          }
        })
      }
    }

    // --- Ground Groups ---
    const groundGroups = value.groundGroups
    if (groundGroups && groundGroups.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `Adding ${groundGroups.length} ground groups for coalition ${missionCoalitionKey} (${key})`
      )

      for (const gg of groundGroups) {
        const groupId = nextId()
        const groupName = `Ground-${groupId}`

        // Expand units: each entry has a name (DCS type) and count
        const expandedUnits: { type: string; x: number; y: number }[] = []
        let unitIndex = 0
        for (const unitEntry of gg.units) {
          for (let i = 0; i < unitEntry.count; i++) {
            expandedUnits.push({
              type: unitEntry.name,
              x: gg.position.x + (unitIndex % 5) * 30,
              y: gg.position.y + Math.floor(unitIndex / 5) * 30
            })
            unitIndex++
          }
        }

        if (expandedUnits.length === 0) continue

        const units = expandedUnits.map((eu, idx) => ({
          unitId: nextId(),
          name: `${groupName}-${idx + 1}`,
          x: eu.x,
          y: eu.y,
          type: eu.type,
          heading: 0,
          skill: 'High'
        }))

        const firstUnit = units[0]
        if (!firstUnit) continue

        country.vehicle.group.push({
          groupId: groupId,
          name: groupName,
          units: units,
          x: firstUnit.x,
          y: firstUnit.y,
          hidden: false,
          start_time: 0,
          route: {
            points: [
              {
                alt: 0,
                alt_type: 'BARO',
                type: 'Turning Point',
                y: firstUnit.y,
                x: firstUnit.x,
                speed: 0,
                action: 'Off Road',
                ETA: 0,
                ETA_locked: true,
                speed_locked: true,
                formation_template: ''
              }
            ]
          }
        })
      }
    }
  }

  return ok()
}
