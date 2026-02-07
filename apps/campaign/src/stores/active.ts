import { schemas } from '@dcc/contracts'
import { createStore } from '@xstate/store'
import { produce } from 'immer'
import * as z from 'zod'

const initialState: z.infer<typeof schemas.campaign.campaign> = {
  time: new Date(),
  timeMultiplier: 1,
  name: 'Active Campaign',
  createdAt: new Date(),
  id: crypto.randomUUID(),
  version: '0.0.1',
  campaignParams: {
    hotStart: false
  },
  scenarioId: 'red-bullet',
  coalitions: {
    player: {
      id: 'usa-2004',
      groundUnitTypes: {
        SAM: [],
        Vehicle: [],
        Infantry: [],
        'Shorad Vehicle': [],
        'Shorad Infantry': [],
        EWS: []
      },
      airdromeNames: [],
      objectiveIds: [],
      aircraftTypes: {
        DEAD: [],
        AWACS: [],
        CAP: [],
        Escort: [],
        'Pinpoint Strike': [],
        CAS: [],
        CSAR: [],
        'Air Assault': [],
        SEAD: [],
        Intercept: [],
        'Fighter Sweep': [],
        'Ground Attack': [],
        'Runway Attack': [],
        Transport: [],
        Refueling: [],
        RescueHelo: [],
        AFAC: [],
        'Antiship Strike': []
      },
      structures: [],
      samGroups: [],
      flightGroups: [],
      groundGroups: [],
      packages: [],
      supplyNodes: {}
    },
    opponent: {
      id: 'russia-1996',
      groundUnitTypes: {
        SAM: [],
        Vehicle: [],
        Infantry: [],
        'Shorad Vehicle': [],
        'Shorad Infantry': [],
        EWS: []
      },
      airdromeNames: [],
      objectiveIds: [],
      aircraftTypes: {
        DEAD: [],
        AWACS: [],
        CAP: [],
        Escort: [],
        'Pinpoint Strike': [],
        CAS: [],
        CSAR: [],
        'Air Assault': [],
        SEAD: [],
        Intercept: [],
        'Fighter Sweep': [],
        'Ground Attack': [],
        'Runway Attack': [],
        Transport: [],
        Refueling: [],
        RescueHelo: [],
        AFAC: [],
        'Antiship Strike': []
      },
      structures: [],
      samGroups: [],
      flightGroups: [],
      groundGroups: [],
      packages: [],
      supplyNodes: {}
    }
  }
}

export const activeStore = createStore({
  context: initialState,
  on: {
    loadCampaign: (_, { campaign }: { campaign: z.infer<typeof schemas.campaign.campaign> }) =>
      campaign,

    updateTime: (context, { time }: { time: Date }) =>
      produce(context, (draft) => {
        draft.time = time
      }),
    updateTimeMultiplier: (context, { timeMultiplier }: { timeMultiplier: number }) =>
      produce(context, (draft) => {
        draft.timeMultiplier = timeMultiplier
      }),
    setTimeTarget: (context, { timeTarget }: { timeTarget: Date | undefined }) =>
      produce(context, (draft) => {
        draft.timeTarget = timeTarget
      }),
    setHotStart: (context, { hotStart }: { hotStart: boolean }) =>
      produce(context, (draft) => {
        if (!draft.campaignParams) {
          draft.campaignParams = {}
        }
        draft.campaignParams.hotStart = hotStart
      }),

    tick: (
      context,
      { delta: _delta, logic }: { delta: number; logic: (draft: typeof context) => void }
    ) =>
      produce(context, (draft) => {
        logic(draft)
      }),

    removeAllFlightGroups: (context) =>
      produce(context, (draft) => {
        draft.coalitions.player.flightGroups = []
        draft.coalitions.opponent.flightGroups = []
      }),

    setFlightGroupClientCount: (
      context,
      { flightGroupId, count }: { flightGroupId: string; count: number }
    ) =>
      produce(context, (draft) => {
        const coalitions = [draft.coalitions.player, draft.coalitions.opponent]

        for (const coalition of coalitions) {
          const group = coalition.flightGroups.find((g) => g.id === flightGroupId)
          if (group) {
            const hadClient = group.aircrafts.some((ac) => ac.client)
            const willHaveClient = count > 0

            // Store original start time before first client is added
            if (!hadClient && willHaveClient && !group.flightplan.originalStartTime) {
              group.flightplan.originalStartTime = group.flightplan.startTime
            }

            // Update client status
            group.aircrafts.forEach((aircraft, index) => {
              aircraft.client = index < count
            })

            // Restore original start time when all clients removed
            if (hadClient && !willHaveClient && group.flightplan.originalStartTime) {
              group.flightplan.startTime = group.flightplan.originalStartTime
              group.flightplan.originalStartTime = undefined
            }

            break
          }
        }

        // Sync start times for all groups with clients to the earliest one
        const allFlightGroups = [
          ...draft.coalitions.player.flightGroups,
          ...draft.coalitions.opponent.flightGroups
        ]
        const groupsWithClients = allFlightGroups.filter((g) => g.aircrafts.some((ac) => ac.client))

        if (groupsWithClients.length > 1) {
          // Find the earliest original start time among groups with clients
          const earliestStartTime = groupsWithClients.reduce((earliest, g) => {
            const originalTime = g.flightplan.originalStartTime ?? g.flightplan.startTime
            return originalTime < earliest ? originalTime : earliest
          }, groupsWithClients[0]!.flightplan.originalStartTime ?? groupsWithClients[0]!.flightplan.startTime)

          // Apply the earliest start time to all groups with clients
          for (const g of groupsWithClients) {
            g.flightplan.startTime = earliestStartTime
          }
        }
      })
  }
})
