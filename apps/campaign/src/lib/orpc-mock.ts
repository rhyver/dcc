import type { ContractRouterClient, InferContractRouterInputs } from '@orpc/contract'
import type { contract } from '@dcc/contracts'
import type { z } from 'zod'
import type { schemas } from '@dcc/contracts'

// Mock campaign data for browser UI development
const emptyAircraftTypes = {
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
  'Antiship Strike': [],
  'Fighter Sweep': [],
  'Ground Attack': [],
  'Runway Attack': [],
  Transport: [],
  Refueling: [],
  RescueHelo: [],
  AFAC: []
}

const emptyGroundUnitTypes = {
  SAM: [],
  Vehicle: [],
  Infantry: [],
  'Shorad Vehicle': [],
  'Shorad Infantry': [],
  EWS: []
}

const createMockCampaign = (): z.infer<typeof schemas.campaign.campaign> => ({
  version: '1.0.0',
  id: 'mock-campaign-id',
  name: 'Mock Campaign',
  createdAt: new Date(),
  time: new Date(),
  timeMultiplier: 1,
  scenarioId: 'mock-scenario',
  coalitions: {
    player: {
      id: 'player',
      aircraftTypes: { ...emptyAircraftTypes },
      groundUnitTypes: { ...emptyGroundUnitTypes },
      airdromeNames: [],
      objectiveIds: [],
      structures: []
    },
    opponent: {
      id: 'opponent',
      aircraftTypes: { ...emptyAircraftTypes },
      groundUnitTypes: { ...emptyGroundUnitTypes },
      airdromeNames: [],
      objectiveIds: [],
      structures: []
    }
  }
})

// Store mock campaign state in memory for browser mode
let mockActiveCampaign: z.infer<typeof schemas.campaign.campaign> | null = null

// Create a mock client that implements the ContractRouterClient interface
export const createMockClient = (): ContractRouterClient<typeof contract> => {
  return {
    campaign: {
      getActiveCampaign: async () => {
        // Return stored mock campaign or null
        return mockActiveCampaign
      },
      createCampaign: async () => {
        // Create and store mock campaign for UI development
        mockActiveCampaign = createMockCampaign()
        return mockActiveCampaign
      },
      saveActiveCampaign: async (
        input: InferContractRouterInputs<typeof contract>['campaign']['saveActiveCampaign']
      ) => {
        // Store the campaign in memory for browser mode
        mockActiveCampaign = input
        return undefined
      },
      generateMiz: async (
        _input: InferContractRouterInputs<typeof contract>['campaign']['generateMiz']
      ) => {
        // No-op for browser mode
        return undefined
      }
    },
    data: {
      getScenario: async (
        _input: InferContractRouterInputs<typeof contract>['data']['getScenario']
      ) => {
        // Return a minimal mock scenario
        throw new Error(
          'Mock data.getScenario not implemented - use Electron for full functionality'
        )
      },
      getTheatre: async (
        _input: InferContractRouterInputs<typeof contract>['data']['getTheatre']
      ) => {
        // Return a minimal mock theatre
        throw new Error(
          'Mock data.getTheatre not implemented - use Electron for full functionality'
        )
      }
    }
  } as ContractRouterClient<typeof contract>
}
