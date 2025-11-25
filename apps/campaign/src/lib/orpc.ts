import type {
  ContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs
} from '@orpc/contract'
import type { contract } from '@dcc/contracts'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/message-port'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { isElectron } from './env'
import { createMockClient } from './orpc-mock'

export type CoreInputs = InferContractRouterInputs<typeof contract>
export type CoreOutputs = InferContractRouterOutputs<typeof contract>

// Use real Electron client or mock client for browser-only mode
let coreClient: ContractRouterClient<typeof contract>

if (isElectron) {
  // Real Electron MessageChannel-based client
  const { port1: clientPort, port2: serverPort } = new MessageChannel()
  window.postMessage('start-orpc-client', '*', [serverPort])
  coreClient = createORPCClient(
    new RPCLink({
      port: clientPort
    })
  )
  clientPort.start()
} else {
  // Mock client for browser-only UI development
  coreClient = createMockClient()
}

export { coreClient }

export const orpc = createTanstackQueryUtils(coreClient)
