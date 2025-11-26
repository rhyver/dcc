import { schemas } from '@dcc/contracts'
import { buildings, structures } from '@dcc/data'
import { err, ok, Result } from 'neverthrow'
import * as z from 'zod'

export function addStructures(
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

    const coalitionStructures = value.structures

    if (!coalitionStructures || coalitionStructures.length === 0) return ok()

    const countryList = mission.coalition[missionCoalitionKey].country

    // countryList is guaranteed to be non-empty array here
    const country = countryList?.[0]
    if (country == null) {
      return err(new Error(`no country found for coalition ${missionCoalitionKey} ${key}`))
    }

    if (!country.static) {
      country.static = { group: [] }
    }

    coalitionStructures.forEach((struct) => {
      const structureDefArray = structures[struct.type as keyof typeof structures]
      if (!structureDefArray || structureDefArray.length === 0) return

      const structureDef = structureDefArray[0]
      if (!structureDef) return

      const objective = theatre.objectives.find((o) => o.name === struct.objectiveId)
      if (!objective) return

      const groupId = nextId()
      const groupName = `Static ${struct.type}-${groupId}`

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const groupUnits: { x: number; y: number; [key: string]: any }[] = []

      const structureBuilding = structureDef.buildings[0]
      if (!structureBuilding) return
      const buildingInfo = buildings[structureBuilding.type]
      if (!buildingInfo) return
      if (!buildingInfo) return

      const unitId = nextId()
      const posX = objective.position.x + structureBuilding.offset.x
      const posY = objective.position.y + structureBuilding.offset.y

      groupUnits.push({
        category: buildingInfo.category,
        shape_name: buildingInfo.shapeName,
        type: buildingInfo.type,
        unitId: unitId,
        rate: 100,
        y: posY,
        x: posX,
        name: `${groupName}-${1}`,
        heading: 0
      })

      country.static?.group.push({
        heading: 0,
        route: {
          points: [
            {
              alt: 0,
              name: `${groupName}-${1}`,
              type: '',
              y: posY,
              speed: 0,
              x: posX,
              formation_template: '',
              action: ''
            }
          ]
        },
        groupId: groupId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        units: groupUnits as any,
        y: posY,
        x: posX,
        name: groupName,
        dead: false
      })
    })
  }

  return ok()
}
