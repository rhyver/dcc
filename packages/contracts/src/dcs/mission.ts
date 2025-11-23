import * as z from 'zod'

// Helper schemas
const dictionaryKey = z.string() // "DictKey_..."

const windLayer = z.object({
  speed: z.number(),
  dir: z.number()
})

const weather = z.object({
  atmosphere_type: z.number(),
  wind: z.object({
    at8000: windLayer,
    atGround: windLayer,
    at2000: windLayer
  }),
  enable_dust: z.boolean(),
  dust_density: z.number(),
  qnh: z.number(),
  groundTurbulence: z.number(),
  type_weather: z.number(),
  modifiedTime: z.boolean().optional(),
  name: z.string().optional(),
  season: z.object({
    temperature: z.number()
  }),
  visibility: z.object({
    distance: z.number()
  }),
  clouds: z.object({
    density: z.number(),
    thickness: z.number(),
    preset: z.string().optional(),
    base: z.number(),
    iprecptns: z.number()
  }),
  cyclones: z.array(z.any()).optional(),
  halo: z
    .object({
      preset: z.string().optional()
    })
    .optional(),
  // Localized names found in file
  name_ru: z.string().optional(),
  name_cn: z.string().optional(),
  name_de: z.string().optional(),
  name_fr: z.string().optional(),
  name_es: z.string().optional()
})

const mapConfig = z.object({
  centerY: z.number(),
  zoom: z.number(),
  centerX: z.number()
})

const dateConfig = z.object({
  Day: z.number(),
  Year: z.number(),
  Month: z.number()
})

const groundControl = z.object({
  passwords: z.object({
    artillery_commander: z.any().optional(),
    instructor: z.any().optional(),
    observer: z.any().optional(),
    forward_observer: z.any().optional()
  }),
  roles: z.object({
    artillery_commander: z.object({
      neutrals: z.number(),
      blue: z.number(),
      red: z.number()
    }),
    instructor: z.object({
      neutrals: z.number(),
      blue: z.number(),
      red: z.number()
    }),
    observer: z.object({
      neutrals: z.number(),
      blue: z.number(),
      red: z.number()
    }),
    forward_observer: z.object({
      neutrals: z.number(),
      blue: z.number(),
      red: z.number()
    })
  }),
  isPilotControlVehicles: z.boolean()
})

const failure = z.object({
  hh: z.number(),
  prob: z.number(),
  enable: z.boolean(),
  mmint: z.number(),
  id: z.string(),
  mm: z.number()
})

const routePoint = z.object({
  alt: z.number(),
  action: z.string(),
  alt_type: z.string(),
  speed: z.number(),
  task: z.any().optional(),
  type: z.string(),
  ETA: z.number(),
  ETA_locked: z.boolean(),
  y: z.number(),
  x: z.number(),
  speed_locked: z.boolean(),
  formation_template: z.string().optional(),
  airdromeId: z.number().optional(),
  properties: z.any().optional()
})

const payload = z
  .object({
    pylons: z.any().optional(), // Can be complex
    fuel: z.number().optional(),
    flare: z.number().optional(),
    ammo_type: z.number().optional(),
    chaff: z.number().optional(),
    gun: z.number().optional()
  })
  .loose()

const unit = z
  .object({
    unitId: z.number(),
    name: z.string(),
    x: z.number(),
    y: z.number(),
    alt: z.number().optional(),
    alt_type: z.string().optional(),
    speed: z.number().optional(),
    type: z.string(),
    skill: z.string().optional(),
    livery_id: z.string().optional(),
    parking: z.string().optional(),
    parking_id: z.string().optional(),
    psi: z.number().optional(),
    onboard_num: z.string().optional(),
    heading: z.number().optional(),
    payload: payload.optional(),
    callsign: z.any().optional(), // Mixed table
    datalinks: z.any().optional(),
    Radio: z.array(z.any()).optional(),
    AddPropAircraft: z.any().optional(),
    communication: z.boolean().optional(),
    start_time: z.number().optional(),
    frequency: z.number().optional(),
    hardpoint_racks: z.boolean().optional()
  })
  .loose()

const group = z
  .object({
    groupId: z.number().optional(),
    name: z.string(),
    units: z.array(unit),
    y: z.number().optional(),
    x: z.number().optional(),
    hidden: z.boolean().optional(),
    visible: z.boolean().optional(),
    task: z.string().optional(),
    route: z
      .object({
        points: z.array(routePoint)
      })
      .optional(),
    tasks: z.any().optional(),
    modulation: z.number().optional(),
    uncontrollable: z.boolean().optional(),
    uncontrolled: z.boolean().optional(),
    start_time: z.number().optional(),
    communication: z.boolean().optional(),
    frequency: z.number().optional(),
    lateActivation: z.boolean().optional()
  })
  .loose()

const country = z
  .object({
    id: z.number(),
    name: z.string(),
    plane: z.object({ group: z.array(group) }).optional(),
    helicopter: z.object({ group: z.array(group) }).optional(),
    ship: z.object({ group: z.array(group) }).optional(),
    vehicle: z.object({ group: z.array(group) }).optional(),
    static: z.object({ group: z.array(group) }).optional()
  })
  .loose()

const coalitionSide = z.object({
  bullseye: z.object({
    x: z.number(),
    y: z.number()
  }),
  nav_points: z.array(z.any()),
  name: z.string(),
  country: z.array(country).optional()
})

export const mission = z
  .object({
    version: z.number(),
    theatre: z.string(),
    descriptionText: dictionaryKey.optional(),
    descriptionRedTask: dictionaryKey.optional(),
    descriptionBlueTask: dictionaryKey.optional(),
    descriptionNeutralsTask: dictionaryKey.optional(),
    sortie: dictionaryKey.optional(),

    currentKey: z.number(),
    maxDictId: z.number(),
    start_time: z.number(),

    requiredModules: z.record(z.string(), z.any()).optional(),

    date: dateConfig,

    weather: weather,

    map: mapConfig,

    failures: z.record(z.string(), failure).optional(),

    // ID mappings
    coalitions: z.object({
      neutrals: z.array(z.number()),
      blue: z.array(z.number()),
      red: z.array(z.number())
    }),

    // Actual data
    coalition: z.object({
      neutrals: coalitionSide,
      blue: coalitionSide,
      red: coalitionSide
    }),

    trig: z
      .object({
        actions: z.any().optional(),
        events: z.any().optional(),
        custom: z.any().optional(),
        func: z.any().optional(),
        flag: z.any().optional(),
        conditions: z.any().optional(),
        customStartup: z.any().optional(),
        funcStartup: z.any().optional()
      })
      .optional(),

    result: z.object({
      total: z.number(),
      offline: z.any(),
      blue: z.any(),
      red: z.any()
    }),

    groundControl: groundControl.optional(),

    triggers: z
      .object({
        zones: z.array(z.any()).optional()
      })
      .optional(),

    goals: z.array(z.any()).optional(),
    forcedOptions: z.any().optional(),
    trigrules: z.any().optional(),

    pictureFileNameB: z.any().optional(),
    pictureFileNameN: z.any().optional(),
    pictureFileNameR: z.any().optional(),
    pictureFileNameServer: z.any().optional()
  })
  .loose()
