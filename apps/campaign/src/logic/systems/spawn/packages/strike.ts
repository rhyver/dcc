import { activeStore } from '@/stores/active'
import { schemas, config } from '@dcc/contracts'
import * as z from 'zod'

export function spawnStrike(coalition: z.infer<typeof schemas.coalition>) {
  const flightGroups = activeStore.getSnapshot().context.coalitions[coalition].flightGroups

  const strikeGroups = flightGroups.filter((group) => group.task === 'Pinpoint Strike')

  console.log(`${coalition}: strike groups`, strikeGroups.length)

  if (strikeGroups.length >= config.packages['Pinpoint Strike'].maxActive[coalition]) {
    return
  }
}
