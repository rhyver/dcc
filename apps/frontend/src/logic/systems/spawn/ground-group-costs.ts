export const INFANTRY_COST = 500
export const VEHICLE_COST = 1000

export function getGroundGroupSpawnCost(structureType: 'Barrack' | 'Depot'): number {
  return structureType === 'Barrack' ? INFANTRY_COST : VEHICLE_COST
}
