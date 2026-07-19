import { aircrafts as aircraftDefinitions, factions, scenarios } from '@dcc/data'

export type CampaignEra = 'Korea' | 'Vietnam' | 'Late CW' | 'Modern'
export type ScenarioStep = 'scenario' | 'era' | 'factions'
export type Scenario = (typeof scenarios)[number]
export type Faction = (typeof factions)[number]

export const factionIdsByEra: Record<CampaignEra, { player: string; opponent: string }> = {
  Korea: { player: 'usa-1952', opponent: 'russia-1955' },
  Vietnam: { player: 'usa-vietnam', opponent: 'russia-vietnam' },
  'Late CW': { player: 'usa-1977', opponent: 'russia-1971' },
  Modern: { player: 'usa-2004', opponent: 'russia-1996' }
}

export const eraOptions: Array<{
  id: CampaignEra
  label: string
  callsign: string
  description: string
}> = [
  {
    id: 'Korea',
    label: 'Korea',
    callsign: 'ANALOG AGE',
    description: 'Korean War-era aircraft with sparse electronics and close-range fights.'
  },
  {
    id: 'Vietnam',
    label: 'Vietnam',
    callsign: 'JUNGLE AGE',
    description: '1960s-era aircraft and helicopters with early missiles and close air support.'
  },
  {
    id: 'Late CW',
    label: 'Late Cold War',
    callsign: 'MISSILE AGE',
    description: '1970s-era aircraft and weapons with early BVR tactics and heavier SAM coverage.'
  },
  {
    id: 'Modern',
    label: 'Modern',
    callsign: 'DIGITAL AGE',
    description: 'Contemporary aircraft, advanced weapons, and high-tempo operations.'
  }
]

export function formatFactionLabel(faction: Faction) {
  return faction.year != null ? `${faction.name} // ${faction.year}` : faction.name
}

export function getFactionAircraft(factionId: string) {
  const faction = factions.find((candidate) => candidate.id === factionId)
  if (!faction) return []

  const rolesByAircraft = new Map<string, string[]>()
  for (const [role, aircraftNames] of Object.entries(faction.aircraftTypes)) {
    for (const aircraftName of aircraftNames) {
      const roles = rolesByAircraft.get(aircraftName) ?? []
      roles.push(role)
      rolesByAircraft.set(aircraftName, roles)
    }
  }

  const definitions = Object.values(aircraftDefinitions)
  return Array.from(rolesByAircraft, ([name, roles]) => {
    const definition = definitions.find((candidate) => candidate.name === name)
    return {
      name,
      displayName: definition?.display_name ?? name,
      controllable: definition?.controllable ?? false,
      isHelicopter: definition?.isHelicopter ?? false,
      isMod: definition?.isMod ?? false,
      roles
    }
  }).sort((left, right) => left.displayName.localeCompare(right.displayName))
}

export type FactionAircraft = ReturnType<typeof getFactionAircraft>[number]
