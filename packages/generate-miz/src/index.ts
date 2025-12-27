import { schemas } from '@dcc/contracts'
import * as luaTable from '@dcc/lua-table'
import AdmZip from 'adm-zip'
import { err, ok, Result } from 'neverthrow'
import * as z from 'zod'

import { addFlightGroups } from './add-flight-groups'
import { addStructures } from './add-structures'
import { dictionary, mapResource } from './l10n'
import { options } from './options'
import { warehouses } from './warehouses'

export function generateMizFromCampaign(
  campaign: z.infer<typeof schemas.campaign.campaign>,
  theatre: z.infer<typeof schemas.theatre>,
  path: string
): Result<void, Error> {
  // eslint-disable-next-line no-console
  console.log('generating miz file')

  const mission: z.infer<typeof schemas.dcs.mission> = {
    version: 23,
    theatre: 'Caucasus',
    descriptionText: 'DictKey_descriptionText_1',
    descriptionRedTask: 'DictKey_descriptionRedTask_2',
    descriptionBlueTask: 'DictKey_descriptionBlueTask_3',
    descriptionNeutralsTask: 'DictKey_descriptionNeutralsTask_4',
    sortie: 'DictKey_sortie_5',
    currentKey: 137,
    maxDictId: 5,
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
      actions: {},
      events: {},
      custom: {},
      func: {},
      flag: {},
      conditions: {},
      customStartup: {},
      funcStartup: {}
    },
    triggers: {
      zones: []
    }
  }

  const structuresResult = addStructures(mission, campaign, theatre)
  if (structuresResult.isErr()) {
    return err(structuresResult.error)
  }

  const flightGroupsResult = addFlightGroups(mission, campaign, theatre)
  if (flightGroupsResult.isErr()) {
    return flightGroupsResult
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
