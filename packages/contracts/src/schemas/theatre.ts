import * as z from 'zod'

import { airdromeDetails } from './airdrome-details'
import { objective } from './objective'
import { target } from './target'

export const theatre = z.object({
  name: z.string(),
  objectives: z.array(objective),
  targets: z.record(z.string(), z.array(target)),
  airdromeDetails: z.record(z.string(), airdromeDetails),
  info: z.object({
    center: z.object({
      x: z.number(),
      y: z.number()
    }),
    weather: z.object({
      temperature: z.object({
        amplitude: z.number(),
        mean: z.number()
      }),
      cloudCover: z.object({
        baseCloudCover: z.number(),
        seasonEffect: z.number()
      }),
      wind: z.object({
        speed: z.number(),
        direction: z.number()
      })
    }),
    night: z.object({
      startHour: z.number(),
      endHour: z.number()
    })
  })
})
