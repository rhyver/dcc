import { schemas } from '@dcc/contracts'
import * as luaTable from '@dcc/lua-table'
import AdmZip from 'adm-zip'
import { err, ok, Result } from 'neverthrow'
import * as z from 'zod'

import { addAwacsGroups } from './add-awacs-groups'
import { addFlightGroups, type MissionFlightConfig } from './add-flight-groups'
import { addGroundGroups } from './add-ground-groups'
import { addStructures } from './add-structures'
import { dictionary, mapResource } from './l10n'
import {
  createDoScriptAction,
  createDoScriptFileAction,
  createLoggedStartupAction,
  createTriggerFunction,
  createTriggerFunctionMap
} from './mission-config-trigger'
import { options } from './options'
import casLuaScript from './scripts/cas.lua?raw'
import ctldLuaScript from './scripts/ctld.lua?raw'
import ewrLuaScript from './scripts/ewr.lua?raw'
import mistLuaScript from './scripts/mist_4_5_126.lua?raw'
import splashDamageLuaScript from './scripts/splash_damage.lua?raw'
import stateLuaScript from './scripts/state.lua?raw'
import { warehouses } from './warehouses'

type TriggerValue = string | number | boolean

type MissionTriggerTables = {
  actions: Record<number, string>
  events: Record<number, unknown>
  custom: Record<number, unknown>
  func: Record<number, string>
  flag: Record<number, boolean>
  conditions: Record<number, string>
  customStartup: Record<number, unknown>
  funcStartup: Record<number, string>
}

type MissionTriggerRule = {
  rules: Record<number, Record<string, TriggerValue>>
  eventlist: string
  comment: string
  actions: Record<number, Record<string, TriggerValue>>
  predicate: string
  colorItem?: string
}

type MissionTriggerRules = Record<number, MissionTriggerRule>

type MissionScriptConfig = {
  missionId: string
  flightGroups: MissionFlightConfig[]
}

function addTransportCargoTriggers(
  mission: z.infer<typeof schemas.dcs.mission>,
  campaign: z.infer<typeof schemas.campaign.campaign>
): void {
  const nextMissionKey = () => {
    mission.currentKey += 1
    return mission.currentKey
  }

  const zones = mission.triggers?.zones ?? []
  if (!mission.triggers) {
    mission.triggers = { zones }
  } else {
    mission.triggers.zones = zones
  }

  if (!mission.trig) {
    mission.trig = {
      actions: {},
      events: {},
      custom: {},
      func: {},
      flag: {},
      conditions: {},
      customStartup: {},
      funcStartup: {}
    }
  }

  const trig = mission.trig as MissionTriggerTables
  const rawTrigrules: unknown = mission.trigrules
  const trigrules: MissionTriggerRules =
    rawTrigrules && typeof rawTrigrules === 'object' ? (rawTrigrules as MissionTriggerRules) : {}
  mission.trigrules = trigrules

  let trigIndex =
    Math.max(0, ...Object.keys(trig.actions).map((key) => Number.parseInt(key, 10))) + 1
  let ruleIndex = Math.max(0, ...Object.keys(trigrules).map((key) => Number.parseInt(key, 10))) + 1

  Object.values(campaign.coalitions).forEach((coalition) => {
    coalition.flightGroups.forEach((fg) => {
      if (fg.task !== 'Transport') return

      const directWp = fg.flightplan.waypoints.find((wp) => wp.name === 'Direct')
      if (!directWp) return

      const zoneId = nextMissionKey()

      zones.push({
        radius: 609.6,
        zoneId: zoneId,
        color: { 1: 1, 2: 1, 3: 1, 4: 0.15 },
        properties: {},
        hidden: false,
        y: directWp.position.y,
        x: directWp.position.x,
        name: 'Cargo',
        heading: 0,
        type: 0
      })

      const actionIndex = trigIndex
      trigIndex += 1

      trig.actions[actionIndex] =
        'a_out_text_delay(getValueDictByKey("DictKey_ActionText_6"), 10, false, 0);'
      trig.conditions[actionIndex] = `return(c_cargo_unhooked_in_zone("ANY_BLUE", ${zoneId}) )`
      trig.flag[actionIndex] = true
      trig.funcStartup[actionIndex] = createTriggerFunction(actionIndex)

      trigrules[ruleIndex] = {
        rules: {
          1: {
            predicate: 'c_cargo_unhooked_in_zone',
            cargo: 'ANY_BLUE',
            zone: zoneId
          }
        },
        eventlist: '',
        comment: 'Cargo Message',
        actions: {
          1: {
            seconds: 10,
            start_delay: 0,
            KeyDict_text: 'DictKey_ActionText_6',
            text: 'DictKey_ActionText_6',
            predicate: 'a_out_text_delay',
            clearview: false
          }
        },
        predicate: 'triggerStart'
      }

      ruleIndex += 1
    })
  })
}

export function generateMizFromCampaign(
  campaign: z.infer<typeof schemas.campaign.campaign>,
  theatre: z.infer<typeof schemas.theatre>,
  path: string
): Result<void, Error> {
  // eslint-disable-next-line no-console
  console.log('generating miz file')

  const ewrEnabled = campaign.campaignParams?.ewr !== false
  const startupTriggerIndexes = ewrEnabled ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6]

  const mission: z.infer<typeof schemas.dcs.mission> = {
    version: 23,
    theatre: 'Caucasus',
    descriptionText: 'DictKey_descriptionText_1',
    descriptionRedTask: 'DictKey_descriptionRedTask_2',
    descriptionBlueTask: 'DictKey_descriptionBlueTask_3',
    descriptionNeutralsTask: 'DictKey_descriptionNeutralsTask_4',
    sortie: 'DictKey_sortie_5',
    currentKey: 137,
    maxDictId: 6,
    start_time:
      campaign.time.getUTCHours() * 3600 +
      campaign.time.getUTCMinutes() * 60 +
      campaign.time.getUTCSeconds(),
    date: {
      Day: campaign.time.getUTCDate(),
      Year: campaign.time.getUTCFullYear(),
      Month: campaign.time.getUTCMonth() + 1
    },
    map: {
      centerY: 635439.49844296,
      zoom: 3381.3919135227,
      centerX: -317865.44994178
    },
    goals: [],
    weather: {
      name: 'Winter, clean sky',
      atmosphere_type: 0,
      wind: {
        at8000: { speed: 0, dir: 0 },
        atGround: { speed: 0, dir: 0 },
        at2000: { speed: 0, dir: 0 }
      },
      enable_dust: false,
      dust_density: 0,
      qnh: 760,
      groundTurbulence: 0,
      type_weather: 0,
      season: { temperature: 20 },
      visibility: { distance: 80000 },
      clouds: {
        density: 0,
        thickness: 200,
        preset: 'Preset2',
        base: 2500,
        iprecptns: 0
      },
      cyclones: [],
      name_ru: 'Лето. Штиль',
      name_cn: '夏季 晴天+无风',
      name_de: 'Sommer, Klar',
      name_fr: 'Eté, ciel dégagé, vent nul',
      name_es: 'Verano. Despejado',
      halo: { preset: 'auto' }
    },
    coalitions: {
      neutrals: [
        91, 70, 83, 23, 65, 86, 64, 25, 63, 76, 84, 90, 29, 62, 30, 78, 87, 31, 61, 32, 33, 60, 17,
        35, 69, 36, 59, 71, 79, 58, 57, 56, 55, 92, 88, 73, 39, 89, 54, 77, 72, 41, 42, 44, 85, 75,
        53, 22, 52, 66, 51, 74, 82, 7, 68, 50, 49, 48, 67
      ],
      blue: [21, 11, 8, 80, 28, 26, 13, 5, 16, 6, 15, 20, 12, 40, 45, 9, 46, 10, 3, 4, 1, 2],
      red: [18, 24, 27, 81, 34, 37, 38, 0, 43, 19, 47]
    },
    coalition: {
      neutrals: {
        bullseye: { y: 0, x: 0 },
        nav_points: [],
        name: 'neutrals',
        country: []
      },
      blue: {
        bullseye: { y: 617414, x: -291014 },
        nav_points: [],
        name: 'blue',
        country: [
          {
            id: 2,
            name: 'USA',
            plane: {
              group: []
            },
            static: {
              group: []
            },
            vehicle: {
              group: []
            }
          }
        ]
      },
      red: {
        bullseye: { y: 371700, x: 11557 },
        nav_points: [],
        name: 'red',
        country: [
          {
            id: 0,
            name: 'USA',
            plane: {
              group: []
            },
            static: {
              group: []
            },
            vehicle: {
              group: []
            }
          }
        ]
      }
    },
    result: {
      offline: { conditions: {}, actions: {}, func: {} },
      total: 0,
      blue: { conditions: {}, actions: {}, func: {} },
      red: { conditions: {}, actions: {}, func: {} }
    },
    groundControl: {
      passwords: {
        artillery_commander: {},
        instructor: {},
        observer: {},
        forward_observer: {}
      },
      roles: {
        artillery_commander: { neutrals: 0, blue: 0, red: 0 },
        instructor: { neutrals: 0, blue: 0, red: 0 },
        observer: { neutrals: 0, blue: 0, red: 0 },
        forward_observer: { neutrals: 0, blue: 0, red: 0 }
      },
      isPilotControlVehicles: false
    },
    trig: {
      actions: {
        1: createLoggedStartupAction(
          'Loading config',
          `a_do_script("config = { missionId = '${campaign.id}', flightGroups = {} }")`
        ),
        2: createLoggedStartupAction('Loading mist', createDoScriptFileAction('ResKey_Action_10')),
        3: createLoggedStartupAction('Loading state', createDoScriptFileAction('ResKey_Action_8')),
        4: createLoggedStartupAction('Loading ctld', createDoScriptFileAction('ResKey_Action_17')),
        5: createLoggedStartupAction(
          'Loading splash damage',
          createDoScriptFileAction('ResKey_Action_7')
        ),
        6: createLoggedStartupAction('Loading cas', createDoScriptFileAction('ResKey_Action_16')),
        ...(ewrEnabled
          ? {
              7: createLoggedStartupAction('Loading ewr', createDoScriptFileAction('ResKey_Action_18'))
            }
          : {})
      },
      events: {},
      custom: {},
      func: {},
      flag: {
        1: true,
        2: true,
        3: true,
        4: true,
        5: true,
        6: true,
        ...(ewrEnabled ? { 7: true } : {})
      },
      conditions: {
        1: 'return(true)',
        2: 'return(true)',
        3: 'return(true)',
        4: 'return(true)',
        5: 'return(true)',
        6: 'return(true)',
        ...(ewrEnabled ? { 7: 'return(true)' } : {})
      },
      customStartup: {},
      funcStartup: createTriggerFunctionMap(startupTriggerIndexes)
    },
    trigrules: {
      1: {
        rules: {},
        eventlist: '',
        predicate: 'triggerStart',
        comment: 'DCC Config',
        actions: {
          1: { predicate: 'a_do_script', text: `config = { missionId = '${campaign.id}' }` }
        },
        colorItem: '0x00ffffff'
      },
      2: {
        rules: {},
        eventlist: '',
        predicate: 'triggerStart',
        comment: 'MIST Script',
        actions: { 1: { predicate: 'a_do_script_file', file: 'ResKey_Action_10' } },
        colorItem: '0x00ffffff'
      },
      3: {
        rules: {},
        eventlist: '',
        predicate: 'triggerStart',
        comment: 'DCC State Script',
        actions: { 1: { predicate: 'a_do_script_file', file: 'ResKey_Action_8' } },
        colorItem: '0x00ffffff'
      },
      4: {
        rules: {},
        eventlist: '',
        predicate: 'triggerStart',
        comment: 'CTLD Script',
        actions: { 1: { predicate: 'a_do_script_file', file: 'ResKey_Action_17' } },
        colorItem: '0x00ffffff'
      },
      5: {
        rules: {},
        eventlist: '',
        predicate: 'triggerStart',
        comment: 'Splash Damage Script',
        actions: { 1: { predicate: 'a_do_script_file', file: 'ResKey_Action_7' } },
        colorItem: '0x00ffffff'
      },
      6: {
        rules: {},
        eventlist: '',
        predicate: 'triggerStart',
        comment: 'CAS JTAC Script',
        actions: { 1: { predicate: 'a_do_script_file', file: 'ResKey_Action_16' } },
        colorItem: '0x00ffffff'
      },
      ...(ewrEnabled
        ? {
            7: {
              rules: {},
              eventlist: '',
              predicate: 'triggerStart',
              comment: 'EWR Script',
              actions: { 1: { predicate: 'a_do_script_file', file: 'ResKey_Action_18' } },
              colorItem: '0x00ffffff'
            }
          }
        : {})
    },
    triggers: {
      zones: []
    }
  }

  const structuresResult = addStructures(mission, campaign, theatre)
  if (structuresResult.isErr()) {
    return err(structuresResult.error)
  }

  const groundGroupsResult = addGroundGroups(mission, campaign, theatre)
  if (groundGroupsResult.isErr()) {
    return err(groundGroupsResult.error)
  }

  const flightGroupsResult = addFlightGroups(mission, campaign, theatre)
  if (flightGroupsResult.isErr()) {
    return err(flightGroupsResult.error)
  }
  const scriptConfig: MissionScriptConfig = {
    missionId: campaign.id,
    flightGroups: flightGroupsResult.value
  }
  const scriptConfigLuaResult = luaTable.stringify(scriptConfig, {
    mixedKeyTypes: true,
    pretty: false
  })
  if (scriptConfigLuaResult.isErr()) {
    return err(scriptConfigLuaResult.error)
  }
  const scriptConfigLua = scriptConfigLuaResult.value
  const trig = mission.trig as MissionTriggerTables
  const trigrules = mission.trigrules as MissionTriggerRules
  const configTriggerRule = trigrules[1]
  if (!configTriggerRule) {
    return err(new Error('Mission config trigger rule is missing'))
  }
  const configScript = `config = ${scriptConfigLua}`
  trig.actions[1] = createLoggedStartupAction('Loading config', createDoScriptAction(configScript))
  configTriggerRule.actions[1] = {
    predicate: 'a_do_script',
    text: configScript
  }

  addTransportCargoTriggers(mission, campaign)

  const awacsResult = addAwacsGroups(mission, campaign, theatre)
  if (awacsResult.isErr()) {
    return awacsResult
  }

  const missionLuaResult = luaTable.stringify(mission, { mixedKeyTypes: true })
  if (missionLuaResult.isErr()) {
    return err(missionLuaResult.error)
  }
  const missionLua = missionLuaResult.value

  const optionsLuaResult = luaTable.stringify(options(), { mixedKeyTypes: true })
  if (optionsLuaResult.isErr()) {
    return err(optionsLuaResult.error)
  }
  const optionsLua = optionsLuaResult.value

  const warehousesLuaResult = luaTable.stringify(warehouses(theatre, campaign), {
    mixedKeyTypes: true
  })
  if (warehousesLuaResult.isErr()) {
    return err(warehousesLuaResult.error)
  }
  const warehousesLua = warehousesLuaResult.value

  const dictionaryLuaResult = luaTable.stringify(dictionary(), { mixedKeyTypes: true })
  if (dictionaryLuaResult.isErr()) {
    return err(dictionaryLuaResult.error)
  }
  const dictionaryLua = dictionaryLuaResult.value

  const mapResourceLuaResult = luaTable.stringify(mapResource(), { mixedKeyTypes: true })
  if (mapResourceLuaResult.isErr()) {
    return err(mapResourceLuaResult.error)
  }
  const mapResourceLua = mapResourceLuaResult.value

  const zip = new AdmZip()
  zip.addFile('mission', Buffer.from('mission = ' + missionLua, 'utf-8'))
  zip.addFile('options', Buffer.from('options = ' + optionsLua, 'utf-8'))
  zip.addFile('theatre', Buffer.from(theatre.name, 'utf-8'))
  zip.addFile('warehouses', Buffer.from('warehouses = ' + warehousesLua, 'utf-8'))
  zip.addFile('l10n/DEFAULT/dictionary', Buffer.from('dictionary = ' + dictionaryLua, 'utf-8'))
  zip.addFile('l10n/DEFAULT/mapResource', Buffer.from('mapResource = ' + mapResourceLua, 'utf-8'))
  zip.addFile('l10n/DEFAULT/mist.lua', Buffer.from(mistLuaScript, 'utf-8'))
  zip.addFile('l10n/DEFAULT/state.lua', Buffer.from(stateLuaScript, 'utf-8'))
  zip.addFile('l10n/DEFAULT/ctld.lua', Buffer.from(ctldLuaScript, 'utf-8'))
  zip.addFile('l10n/DEFAULT/splash_damage.lua', Buffer.from(splashDamageLuaScript, 'utf-8'))
  zip.addFile('l10n/DEFAULT/cas.lua', Buffer.from(casLuaScript, 'utf-8'))
  zip.addFile('l10n/DEFAULT/ewr.lua', Buffer.from(ewrLuaScript, 'utf-8'))
  try {
    zip.writeZip(path)
    // eslint-disable-next-line no-console
    console.log('🚀 mission saved to', path)
    return ok(undefined)
  } catch (error) {
    if (error instanceof Error) {
      return err(error)
    }
    return err(new Error('Unknown error writing zip file'))
  }
}
