import { schemas } from '@dcc/contracts'
import { samTemplates } from '@dcc/data'
import { ok, Result } from 'neverthrow'
import * as z from 'zod'

import { findTargetPlacement, positionsMatch } from './target-placement'

type Campaign = z.infer<typeof schemas.campaign.campaign>
type CampaignCoalition = Campaign['coalitions'][z.infer<typeof schemas.coalition>]

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

function positionUnits(
  fallbackCenter: { x: number; y: number },
  count: number,
  spacing: number,
  target?: z.infer<typeof schemas.target>
) {
  const fallbackPositions = arrangeUnits(fallbackCenter, count, spacing)

  return Array.from({ length: count }).map((_, index) => {
    const targetPosition = target?.unitPositions[index]
    const fallbackPosition = fallbackPositions[index] ?? fallbackCenter

    return {
      x: targetPosition?.x ?? fallbackPosition.x,
      y: targetPosition?.y ?? fallbackPosition.y,
      heading: targetPosition?.heading ?? 0
    }
  })
}

function isAirDefenseUnit(unitName: string, coalition: CampaignCoalition) {
  const airDefenseTypes = new Set([
    ...coalition.groundUnitTypes.SAM,
    ...coalition.groundUnitTypes['Shorad Vehicle'],
    ...coalition.groundUnitTypes['Shorad Infantry']
  ])

  return (
    airDefenseTypes.has(unitName) ||
    /\b(aaa|sam|shorad|stinger|igla|linebacker|shilka|osa|tunguska|tor)\b/i.test(unitName)
  )
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
        const groupName = `SAM-${sam.id}-${sam.type}-${groupId}`
        const target = findTargetPlacement(theatre, {
          objectiveName: sam.objectiveId,
          type: 'SAM'
        })
        const positions = positionUnits(objective.position, template.units.length, 50, target)

        const units = template.units.map((unitType, index) => {
          const pos = positions[index] ?? { ...objective.position, heading: 0 }
          return {
            unitId: nextId(),
            name: `${groupName}-${index + 1}`,
            x: pos.x,
            y: pos.y,
            type: unitType,
            heading: pos.heading,
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
        const groupName = `Ground-${gg.id}-${groupId}`

        // Expand units: each entry has a name (DCS type) and count
        let shouldUseObjectiveTargets = false
        let target = findTargetPlacement(theatre, {
          objectiveName: gg.objectiveId,
          type: 'Vehicle',
          nameIncludes: '|Vehicle|',
          position: gg.position
        })
        if (target && gg.state === 'idle' && gg.objectiveId) {
          shouldUseObjectiveTargets = true
        }
        if (!target && gg.state === 'idle') {
          const objective = gg.objectiveId
            ? theatre.objectives.find((entry) => entry.name === gg.objectiveId)
            : undefined
          if (objective && positionsMatch(gg.position, objective.position)) {
            shouldUseObjectiveTargets = true
            target = findTargetPlacement(theatre, {
              objectiveName: gg.objectiveId,
              type: 'Vehicle',
              nameIncludes: '|Vehicle|'
            })
          }
        }
        const aaaTarget = shouldUseObjectiveTargets
          ? findTargetPlacement(theatre, {
              objectiveName: gg.objectiveId,
              type: 'AAA',
              nameIncludes: '|AAA|'
            })
          : undefined
        const expandedUnits: { type: string; x: number; y: number; heading: number }[] = []
        let unitIndex = 0
        let vehicleUnitIndex = 0
        let airDefenseUnitIndex = 0
        for (const unitEntry of gg.units) {
          for (let i = 0; i < unitEntry.count; i++) {
            const useAaaTarget = aaaTarget && isAirDefenseUnit(unitEntry.name, value)
            const fallbackCenter = useAaaTarget ? aaaTarget.position : gg.position
            const placementIndex = useAaaTarget ? airDefenseUnitIndex : unitIndex
            const targetPosition = useAaaTarget
              ? aaaTarget.unitPositions[airDefenseUnitIndex++]
              : target?.unitPositions[vehicleUnitIndex++]
            expandedUnits.push({
              type: unitEntry.name,
              x: targetPosition?.x ?? fallbackCenter.x + (placementIndex % 5) * 30,
              y: targetPosition?.y ?? fallbackCenter.y + Math.floor(placementIndex / 5) * 30,
              heading: targetPosition?.heading ?? 0
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
          heading: eu.heading,
          skill: 'High'
        }))

        const firstUnit = units[0]
        if (!firstUnit) continue

        // Build route waypoints
        const isInfantry = gg.units.every((u) => /infantry|soldier/i.test(u.name))
        const routePoints = [
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

        // Add attack waypoint for groups with a target objective
        if (gg.targetObjectiveId) {
          const targetObj = theatre.objectives.find((o) => o.name === gg.targetObjectiveId)
          if (targetObj) {
            const speed = isInfantry ? 4 : 12
            routePoints.push({
              alt: 0,
              alt_type: 'BARO',
              type: 'Turning Point',
              y: targetObj.position.y,
              x: targetObj.position.x,
              speed,
              action: 'Off Road',
              ETA: 0,
              ETA_locked: false,
              speed_locked: true,
              formation_template: ''
            })
          }
        }

        country.vehicle.group.push({
          groupId: groupId,
          name: groupName,
          units: units,
          x: firstUnit.x,
          y: firstUnit.y,
          hidden: false,
          start_time: 0,
          route: {
            points: routePoints
          }
        })
      }
    }
  }

  return ok()
}
