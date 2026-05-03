import { schemas } from '@dcc/contracts'
import * as z from 'zod'

const PACKAGE_START_SPACING_MS = 10 * 60 * 1000
const FLIGHT_START_SPACING_WITHIN_PACKAGE_MS = 2 * 60 * 1000
const PACKAGE_FLIGHT_START_PRIORITY: Partial<Record<FlightGroup['task'], number>> = {
  SEAD: 0
}

type Campaign = z.infer<typeof schemas.campaign.campaign>
type Coalition = z.infer<typeof schemas.coalition>
type FlightGroup = Campaign['coalitions']['player']['flightGroups'][number]

type PackageSchedule = {
  key: string
  homeBase: string
  groups: FlightGroup[]
  startTime: Date
  latestStartTime: Date
  hasClients: boolean
}

function getPackageKey(group: FlightGroup) {
  return group.packageId ?? group.id
}

function addMs(date: Date | string, ms: number) {
  return new Date(new Date(date).getTime() + ms)
}

function shiftGroupTime(group: FlightGroup, deltaMs: number) {
  group.flightplan.startTime = addMs(group.flightplan.startTime, deltaMs)

  if (group.flightplan.originalStartTime) {
    group.flightplan.originalStartTime = addMs(group.flightplan.originalStartTime, deltaMs)
  }

  if (group.tot) {
    group.tot = addMs(group.tot, deltaMs)
  }
}

function shiftPackageTot(
  draft: Campaign,
  coalition: Coalition,
  packageKey: string,
  deltaMs: number
) {
  const missionPackage = draft.coalitions[coalition].packages.find((pkg) => pkg.id === packageKey)
  if (missionPackage) {
    missionPackage.tot = addMs(missionPackage.tot, deltaMs)
  }
}

function collectSchedules(groups: FlightGroup[]): PackageSchedule[] {
  const byHomeAndPackage = new Map<string, PackageSchedule>()

  for (const group of groups) {
    const packageKey = getPackageKey(group)
    const key = `${group.homeBase}:${packageKey}`
    const startTime = new Date(group.flightplan.startTime)
    const hasClients = group.aircrafts.some((aircraft) => aircraft.client)
    const existing = byHomeAndPackage.get(key)

    if (existing) {
      existing.groups.push(group)
      existing.hasClients ||= hasClients
      if (startTime < existing.startTime) {
        existing.startTime = startTime
      }
      if (startTime > existing.latestStartTime) {
        existing.latestStartTime = startTime
      }
      continue
    }

    byHomeAndPackage.set(key, {
      key: packageKey,
      homeBase: group.homeBase,
      groups: [group],
      startTime,
      latestStartTime: startTime,
      hasClients
    })
  }

  return [...byHomeAndPackage.values()]
}

function enforceFlightSpacingWithinPackage(schedule: PackageSchedule) {
  schedule.groups.sort(
    (a, b) =>
      (PACKAGE_FLIGHT_START_PRIORITY[a.task] ?? 1) - (PACKAGE_FLIGHT_START_PRIORITY[b.task] ?? 1) ||
      new Date(a.flightplan.startTime).getTime() - new Date(b.flightplan.startTime).getTime()
  )

  let previousStartTime: Date | null = null
  for (const group of schedule.groups) {
    const startTime = new Date(group.flightplan.startTime)
    if (!previousStartTime) {
      previousStartTime = startTime
      continue
    }

    const earliestAllowedStart: Date = new Date(
      previousStartTime.getTime() + FLIGHT_START_SPACING_WITHIN_PACKAGE_MS
    )
    if (startTime < earliestAllowedStart) {
      shiftGroupTime(group, earliestAllowedStart.getTime() - startTime.getTime())
      previousStartTime = earliestAllowedStart
    } else {
      previousStartTime = startTime
    }
  }

  schedule.startTime = new Date(schedule.groups[0]?.flightplan.startTime ?? schedule.startTime)
  schedule.latestStartTime = new Date(
    schedule.groups.at(-1)?.flightplan.startTime ?? schedule.latestStartTime
  )
}

export function enforcePackageStartSpacing(draft: Campaign, coalition: Coalition) {
  const schedulesByHome = new Map<string, PackageSchedule[]>()
  for (const schedule of collectSchedules(draft.coalitions[coalition].flightGroups)) {
    const schedules = schedulesByHome.get(schedule.homeBase)
    if (schedules) {
      schedules.push(schedule)
    } else {
      schedulesByHome.set(schedule.homeBase, [schedule])
    }
  }

  for (const schedules of schedulesByHome.values()) {
    for (const schedule of schedules) {
      if (!schedule.hasClients) {
        enforceFlightSpacingWithinPackage(schedule)
      }
    }

    schedules.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    let previousLatestStartTime: Date | null = null
    for (const schedule of schedules) {
      const fixedByClient = schedule.hasClients
      const alreadyStarted = schedule.startTime <= draft.time

      if (!previousLatestStartTime || fixedByClient || alreadyStarted) {
        previousLatestStartTime = schedule.latestStartTime
        continue
      }

      const earliestAllowedStart: Date = new Date(
        previousLatestStartTime.getTime() + PACKAGE_START_SPACING_MS
      )
      if (schedule.startTime < earliestAllowedStart) {
        const deltaMs = earliestAllowedStart.getTime() - schedule.startTime.getTime()

        for (const group of schedule.groups) {
          shiftGroupTime(group, deltaMs)
        }
        shiftPackageTot(draft, coalition, schedule.key, deltaMs)
        schedule.startTime = earliestAllowedStart
        schedule.latestStartTime = addMs(schedule.latestStartTime, deltaMs)
      }

      previousLatestStartTime = schedule.latestStartTime
    }
  }
}
