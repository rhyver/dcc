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
    },
    DEAD: {
      maxActive: {
        player: 1,
        opponent: 1
      },
      maxDistance: 300_000,
      aircraftsPerGroup: 2
    },
    CAS: {
      maxActive: {
        player: 2,
        opponent: 2
      },
      maxDistance: 250_000,
      aircraftsPerGroup: 2
    },
    CAP: {
      maxActive: {
        player: 2,
        opponent: 2
      },
      maxDistance: 200_000,
      aircraftsPerGroup: 2,
      engagementRange: 80_000, // Radar + missile range for A2A engagement
      patrolDuration: 60 * 60 * 1000 // 1 hour patrol time
    },
    Transport: {
      maxActive: {
        player: 3,
        opponent: 3
      },
      maxDistance: 400_000, // 400km strategic range
      tacticalMaxDistance: 80_000, // 80km for CH-47
      c130CargoCapacity: 5000,
      ch47CargoCapacity: 1500,
      emergencyCargoCapacity: 750,
      aircraftsPerGroup: 1
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
