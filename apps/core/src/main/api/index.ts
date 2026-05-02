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
      // During mission polling, these errors are expected until DCS writes a fresh state file.
      if (error && typeof error === 'object' && 'defined' in error && 'code' in error) {
        const e = error as {
          code?: string
          data?: { message?: string }
        }

        if (e.code === 'STALE_STATE_FILE') return

        if (e.code === 'FAILED_TO_READ_FILE') return

        if (e.code === 'MISSION_ID_MISMATCH') return

        if (e.code === 'INVALID_STATE_FILE') {
          const msg = e.data?.message ?? ''
          // Happens when the exporter truncates/writes the JSON in multiple chunks.
          if (msg.includes('Unexpected end of JSON input')) return
        }
      }

      console.error(error)
    })
  ]
})
