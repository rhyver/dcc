import { schemas } from '@dcc/contracts'
import {
  campaignHasFulcrumClient,
  FULCRUM_AIRCRAFT_NAME,
  GCI_PICTURE_RADAR_TYPES,
  GCI_RADAR_LINK_METERS,
  GCI_RANGE_METERS,
  GCI_STATION_TYPE,
  planCampaignGciStations,
  type PlannedGciStation
} from '@dcc/data'
import * as z from 'zod'

import type { MissionFlightConfig } from './add-flight-groups'
import { resolveAiSkill } from './ai-skill'
import { addPersistentEwrGroups } from './iads'

// KRU task and vehicle layout ported from Samuelblew/DCC-Project-Germany- at 4281245.
// Reserve radars are prepared by the campaign's IADS Network, never recreated here.
type Campaign = z.infer<typeof schemas.campaign.campaign>
type Mission = z.infer<typeof schemas.dcs.mission>
type Theatre = z.infer<typeof schemas.theatre>
type MissionCountry = NonNullable<Mission['coalition']['blue']['country']>[number]
type MissionVehicleGroup = NonNullable<NonNullable<MissionCountry['vehicle']>['group']>[number]
export type PlayerGciStation = PlannedGciStation & {
  groupName: string
  unitName: string
  unitId: number
  radius: number
}

export function addGciStations(
  mission: Mission,
  campaign: Campaign,
  theatre: Theatre
): PlayerGciStation[] {
  const planned = planCampaignGciStations(campaign, theatre)
  const spawned: PlayerGciStation[] = []
  for (const coalition of ['player', 'opponent'] as const) {
    if (coalition === 'player' && !campaignHasFulcrumClient(campaign)) continue
    const country = mission.coalition[coalition === 'player' ? 'blue' : 'red'].country?.[0]
    if (!country) continue
    const stations = planned[coalition]
    if (stations.length === 0) continue
    country.vehicle ??= { group: [] }
    addPersistentEwrGroups(
      mission,
      campaign,
      coalition,
      (ewr) =>
        GCI_PICTURE_RADAR_TYPES.has(ewr.type) &&
        stations.some(
          (station) =>
            Math.hypot(ewr.position.x - station.position.x, ewr.position.y - station.position.y) <=
            GCI_RADAR_LINK_METERS
        )
    )
    // Like existing SAMs, keep the network active outside the 10 km ground-culling radius.
    for (const station of stations)
      spawned.push(spawnGciStation(mission, country, campaign, station))
  }
  return spawned
}

export function configureNativeGci(
  flights: MissionFlightConfig[],
  campaign: Campaign,
  stations: PlayerGciStation[]
) {
  const friendly = stations.filter((station) => station.coalition === 'player')
  for (const flight of flights) {
    const group = campaign.coalitions.player.flightGroups.find(
      (group) => group.callsign === flight.name
    )
    if (
      !group?.aircrafts.some(
        (aircraft) => aircraft.client && aircraft.aircraftName === FULCRUM_AIRCRAFT_NAME
      )
    )
      continue
    const station =
      friendly.find((station) => station.airdromeName === group.homeBase) ??
      [...friendly].sort(
        (left, right) =>
          distance(left.position, group.position) - distance(right.position, group.position)
      )[0]
    if (station) flight.nativeGci = { channel: station.channel, stationName: station.airdromeName }
  }
}

function spawnGciStation(
  mission: Mission,
  country: MissionCountry,
  campaign: Campaign,
  station: PlannedGciStation
): PlayerGciStation {
  const groupId = nextId(mission)
  const unitId = nextId(mission)
  const groupName = station.id
  const unitName = `${station.id}-1`
  const skill = resolveAiSkill(campaign, station.coalition, 'High')

  country.vehicle!.group.push(
    gciVehicleGroup({
      groupId,
      groupName,
      unitId,
      unitName,
      type: GCI_STATION_TYPE,
      position: station.position,
      skill,
      task: activateGciTask(unitId, station.channel)
    })
  )

  return {
    ...station,
    groupName,
    unitName,
    unitId,
    channel: station.channel,
    radius: GCI_RANGE_METERS,
    coalition: station.coalition,
    airdromeName: station.airdromeName,
    position: station.position
  }
}

function gciVehicleGroup(params: {
  groupId: number
  groupName: string
  unitId: number
  unitName: string
  type: string
  position: { x: number; y: number }
  skill: string
  task?: ReturnType<typeof activateGciTask>
}): MissionVehicleGroup {
  const { x, y } = params.position
  return {
    groupId: params.groupId,
    name: params.groupName,
    units: [
      {
        unitId: params.unitId,
        name: params.unitName,
        x,
        y,
        type: params.type,
        heading: 0,
        skill: params.skill
      }
    ],
    x,
    y,
    hidden: false,
    start_time: 0,
    route: {
      points: [
        {
          alt: 0,
          alt_type: 'BARO',
          type: 'Turning Point',
          y,
          x,
          speed: 0,
          action: 'Off Road',
          ETA: 0,
          ETA_locked: true,
          speed_locked: true,
          formation_template: '',
          ...(params.task ? { task: params.task } : {})
        }
      ]
    }
  }
}

function activateGciTask(unitId: number, channel: number) {
  return {
    id: 'ComboTask',
    params: {
      tasks: [
        {
          enabled: true,
          auto: true,
          id: 'WrappedAction',
          number: 1,
          params: {
            action: {
              id: 'ActivateGCI',
              params: {
                channel,
                radius: GCI_RANGE_METERS,
                x: 0,
                y: 0,
                unitId
              }
            }
          }
        }
      ]
    }
  }
}

function nextId(mission: Mission) {
  mission.currentKey += 1
  return mission.currentKey
}

function distance(left: { x: number; y: number }, right: { x: number; y: number }) {
  return Math.hypot(left.x - right.x, left.y - right.y)
}
