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
      groundGroups: []
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
      groundGroups: []
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

    tick: (context, { delta, logic }: { delta: number; logic: (draft: typeof context) => void }) =>
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
            group.aircrafts.forEach((aircraft, index) => {
              aircraft.client = index < count
            })
            break
          }
        }
      })
  }
})
