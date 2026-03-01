import { RPCHandler } from '@orpc/server/message-port'
import { onError } from '@orpc/server'
import { campaign } from './campaign'
import { data } from './data'
import { missionGenerator } from './mission-generator'
import { pub } from './orpc'

const router = pub.router({
  campaign,
  data,
  missionGenerator
})

export const rpcHandler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error)
    })
  ]
})
