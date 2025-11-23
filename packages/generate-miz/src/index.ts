import { schemas } from '@dcc/contracts'
import * as luaTable from '@kilcekru/lua-table'
import AdmZip from 'adm-zip'
import * as z from 'zod'

import { dictionary, mapResource } from './l10n'
import { options } from './options'
import { warehouses } from './warehouses'

export function generateMizFromCampaign(
  campaign: z.infer<typeof schemas.campaign.campaign>,
  theatre: z.infer<typeof schemas.theatre>,
  path: string
) {
  // eslint-disable-next-line no-console
  console.log('generate', campaign)

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
    start_time: 28800,
    date: {
      Day: 21,
      Year: 2016,
      Month: 6
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
              group: [
                {
                  modulation: 0,
                  tasks: {},
                  uncontrollable: false,
                  task: 'CAP',
                  uncontrolled: false,
                  route: {
                    points: [
                      {
                        alt: 18,
                        action: 'From Parking Area',
                        alt_type: 'BARO',
                        properties: {
                          addopt: {}
                        },
                        speed: 138.88888888889,
                        task: {
                          id: 'ComboTask',
                          params: {
                            tasks: [
                              {
                                enabled: true,
                                key: 'CAP',
                                id: 'EngageTargets',
                                number: 1,
                                auto: true,
                                params: {
                                  targetTypes: ['Air'],
                                  priority: 0
                                }
                              },
                              {
                                enabled: true,
                                auto: true,
                                id: 'WrappedAction',
                                number: 2,
                                params: {
                                  action: {
                                    id: 'Option',
                                    params: {
                                      value: true,
                                      name: 17
                                    }
                                  }
                                }
                              },
                              {
                                enabled: true,
                                auto: true,
                                id: 'WrappedAction',
                                number: 3,
                                params: {
                                  action: {
                                    id: 'Option',
                                    params: {
                                      value: 4,
                                      name: 18
                                    }
                                  }
                                }
                              },
                              {
                                enabled: true,
                                auto: true,
                                id: 'WrappedAction',
                                number: 4,
                                params: {
                                  action: {
                                    id: 'Option',
                                    params: {
                                      value: true,
                                      name: 19
                                    }
                                  }
                                }
                              },
                              {
                                enabled: true,
                                auto: true,
                                id: 'WrappedAction',
                                number: 5,
                                params: {
                                  action: {
                                    id: 'Option',
                                    params: {
                                      targetTypes: [],
                                      name: 21,
                                      value: 'none;',
                                      noTargetTypes: [
                                        'Fighters',
                                        'Multirole fighters',
                                        'Bombers',
                                        'Helicopters',
                                        'UAVs',
                                        'Infantry',
                                        'Fortifications',
                                        'Tanks',
                                        'IFV',
                                        'APC',
                                        'Artillery',
                                        'Unarmed vehicles',
                                        'AAA',
                                        'SR SAM',
                                        'MR SAM',
                                        'LR SAM',
                                        'Aircraft Carriers',
                                        'Cruisers',
                                        'Destroyers',
                                        'Frigates',
                                        'Corvettes',
                                        'Light armed ships',
                                        'Unarmed ships',
                                        'Submarines',
                                        'Cruise missiles',
                                        'Antiship Missiles',
                                        'AA Missiles',
                                        'AG Missiles',
                                        'SA Missiles'
                                      ]
                                    }
                                  }
                                }
                              },
                              {
                                enabled: true,
                                auto: true,
                                id: 'WrappedAction',
                                number: 6,
                                params: {
                                  action: {
                                    id: 'EPLRS',
                                    params: {
                                      value: true,
                                      groupId: 1
                                    }
                                  }
                                }
                              },
                              {
                                enabled: true,
                                auto: true,
                                id: 'WrappedAction',
                                number: 7,
                                params: {
                                  action: {
                                    id: 'Option',
                                    params: {
                                      value: true,
                                      name: 35
                                    }
                                  }
                                }
                              }
                            ]
                          }
                        },
                        type: 'TakeOffParking',
                        ETA: 0,
                        ETA_locked: true,
                        y: 635293,
                        x: -317776.65625,
                        speed_locked: true,
                        formation_template: '',
                        airdromeId: 24
                      }
                    ]
                  },
                  groupId: 1,
                  hidden: false,
                  units: [
                    {
                      alt: 18,
                      alt_type: 'BARO',
                      livery_id: 'default',
                      skill: 'Client',
                      parking: '4',
                      speed: 138.88888888889,
                      AddPropAircraft: {
                        HelmetMountedDevice: 1,
                        VoiceCallsignLabel: 'ED',
                        STN_L16: '00201',
                        LAU3ROF: 0,
                        VoiceCallsignNumber: '11'
                      },
                      type: 'F-16C_50',
                      Radio: [
                        {
                          channelsNames: {},
                          modulations: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                          channels: [
                            305, 264, 265, 256, 254, 250, 270, 257, 255, 262, 259, 268, 269, 260,
                            263, 261, 267, 251, 253, 266
                          ]
                        },
                        {
                          channelsNames: {},
                          modulations: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                          channels: [
                            127, 135, 136, 127, 125, 121, 141, 128, 126, 133, 130, 139, 140, 131,
                            134, 132, 138, 122, 124, 137
                          ]
                        }
                      ],
                      unitId: 1,
                      psi: 0,
                      onboard_num: '010',
                      parking_id: '40',
                      x: -317776.65625,
                      name: 'Aerial-1-1',
                      payload: {
                        pylons: {},
                        fuel: 3249,
                        flare: 60,
                        ammo_type: 5,
                        chaff: 60,
                        gun: 100
                      },
                      y: 635293,
                      heading: 0,
                      callsign: {
                        1: 5,
                        2: 1,
                        3: 1,
                        4: 'Dodge11',
                        name: 'Dodge11'
                      },
                      datalinks: {
                        Link16: {
                          settings: {
                            flightLead: true,
                            transmitPower: 3,
                            specialChannel: 1,
                            fighterChannel: 1,
                            missionChannel: 1
                          },
                          network: {
                            teamMembers: [
                              {
                                TDOA: true,
                                missionUnitId: 1
                              }
                            ],
                            donors: {}
                          }
                        }
                      },
                      communication: true,
                      start_time: 0,
                      frequency: 305
                    }
                  ],
                  y: 635293,
                  x: -317776.65625,
                  name: 'Aerial-1',
                  communication: true,
                  start_time: 0,
                  frequency: 305
                }
              ]
            }
          }
        ]
      },
      red: {
        bullseye: { y: 371700, x: 11557 },
        nav_points: [],
        name: 'red',
        country: []
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
    }
  }

  const lua = luaTable.stringify(mission, { mixedKeyTypes: true })

  const zip = new AdmZip()
  zip.addFile('mission', Buffer.from('mission = ' + lua, 'utf-8'))
  zip.addFile(
    'options',
    Buffer.from('options = ' + luaTable.stringify(options(), { mixedKeyTypes: true }), 'utf-8')
  )
  zip.addFile('theatre', Buffer.from(theatre.name, 'utf-8'))
  zip.addFile(
    'warehouses',
    Buffer.from(
      'warehouses = ' + luaTable.stringify(warehouses(theatre, campaign), { mixedKeyTypes: true }),
      'utf-8'
    )
  )
  zip.addFile(
    'l10n/DEFAULT/dictionary',
    Buffer.from(
      'dictionary = ' + luaTable.stringify(dictionary(), { mixedKeyTypes: true }),
      'utf-8'
    )
  )
  zip.addFile(
    'l10n/DEFAULT/mapResource',
    Buffer.from(
      'mapResource = ' + luaTable.stringify(mapResource(), { mixedKeyTypes: true }),
      'utf-8'
    )
  )
  zip.writeZip(path)

  // eslint-disable-next-line no-console
  console.log('🚀 mission saved to', path)
}
