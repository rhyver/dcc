export const config = {
  packages: {
    'Pinpoint Strike': {
      maxActive: {
        player: 2,
        opponent: 2
      },
      maxDistance: 300_000,
      aircraftsPerGroup: 2
    },
    SEAD: {
      maxActive: {
        player: 2,
        opponent: 2
      },
      maxDistance: 300_000,
      aircraftsPerGroup: 2,
      leadTime: 2 * 60 * 1000 // 2 minutes before strike ToT
    }
  },
  structureRanges: {
    'Power Plant': 50_000,
    'Ammo Depot': 50_000,
    'Fuel Storage': 50_000,
    Hospital: 50_000,
    Barrack: 50_000,
    Depot: 60_000,
    Farp: 50_000
  }
}
