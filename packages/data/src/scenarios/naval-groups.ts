export const operationalGroup = (
  id: string,
  name: string,
  role: 'carrier' | 'escort' | 'transport' | 'surface-combatant',
  unitTypes: string[],
  position: { x: number; y: number },
  heading: number,
  cargo = 0,
  missionGroupId?: string
) => ({
  id,
  name,
  role,
  missionGroupId,
  unitTypes,
  units: unitTypes.map((type, index) => ({
    id: `${id}-ship-${index + 1}`,
    type,
    damage: 0,
    ammunition: 1,
    fuel: 1,
    state: 'operational' as const
  })),
  position,
  heading,
  damage: 0,
  fuel: 1,
  ammunition: 1,
  cargo,
  state: 'operational' as const
})

export const radians = (degrees: number) => (degrees * Math.PI) / 180

/** A Supercarrier with a two-ship escort screen sailing in the same mission group. */
export const carrierStrikeGroup = (position: { x: number; y: number }, heading: number) => [
  {
    ...operationalGroup('carrier-group', 'Carrier Group', 'carrier', ['CVN_71'], position, heading),
    tacan: { channel: 71, band: 'X' as const, callsign: 'CVN' }
  },
  operationalGroup(
    'carrier-escort-group',
    'Carrier Escort Screen',
    'escort',
    ['TICONDEROG', 'USS_Arleigh_Burke_IIa'],
    { x: position.x - 3_000, y: position.y + 3_000 },
    heading,
    0,
    'carrier-group'
  )
]
