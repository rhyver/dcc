import { schemas } from '@dcc/contracts'
import { buildings, structures } from '@dcc/data'
import { err, ok } from 'neverthrow'
import * as z from 'zod'

export function addStructuresToMission(
  mission: z.infer<typeof schemas.dcs.mission>,
  campaign: z.infer<typeof schemas.campaign.campaign>,
  theatre: z.infer<typeof schemas.theatre>
) {
  const nextId = () => {
    mission.currentKey += 1
    return mission.currentKey
  }

  Object.entries(campaign.coalitions).forEach(([key, value]) => {
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

      structureDef.buildings.forEach((b, index) => {
        const buildingInfo = buildings[b.type]
        if (!buildingInfo) return

        const unitId = nextId()
        const posX = objective.position.x + b.offset.x
        const posY = objective.position.y + b.offset.y

        groupUnits.push({
          category: buildingInfo.category,
          shape_name: buildingInfo.shapeName,
          type: buildingInfo.type,
          unitId: unitId,
          rate: 100,
          y: posY,
          x: posX,
          name: `${groupName}-${index + 1}`,
          heading: 0
        })
      })

      if (groupUnits.length > 0) {
        country.static?.group.push({
          heading: 0,
          route: { points: [] },
          groupId: groupId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          units: groupUnits as any,
          y: groupUnits[0]?.y ?? 0,
          x: groupUnits[0]?.x ?? 0,
          name: groupName,
          dead: false
        })
      }
    })
  })

  return ok()
}
