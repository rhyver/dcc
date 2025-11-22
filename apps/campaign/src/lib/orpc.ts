import type {
  ContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs
} from '@orpc/contract'
import type { contract } from '@dcc/contracts'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/message-port'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'

const { port1: clientPort, port2: serverPort } = new MessageChannel()

window.postMessage('start-orpc-client', '*', [serverPort])

export type CoreInputs = InferContractRouterInputs<typeof contract>
export type CoreOutputs = InferContractRouterOutputs<typeof contract>

export const coreClient: ContractRouterClient<typeof contract> = createORPCClient(
  new RPCLink({
    port: clientPort
  })
)

clientPort.start()

export const orpc = createTanstackQueryUtils(coreClient)
