import type {
  ContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs
} from '@orpc/contract'
import type { contract } from '@dcc/contracts'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/message-port'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'

export type CoreInputs = InferContractRouterInputs<typeof contract>
export type CoreOutputs = InferContractRouterOutputs<typeof contract>

// Real Electron MessageChannel-based client
const { port1: clientPort, port2: serverPort } = new MessageChannel()
window.postMessage('start-orpc-client', '*', [serverPort])
const coreClient: ContractRouterClient<typeof contract> = createORPCClient(
  new RPCLink({
    port: clientPort
  })
)
clientPort.start()

export { coreClient }

export const orpc = createTanstackQueryUtils(coreClient)
