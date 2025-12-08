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
      })
  }
})
