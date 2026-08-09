import { schemas } from '@dcc/contracts'
import * as z from 'zod'

type Airdrome = z.infer<typeof schemas.airdromeDetails>
type AirdromeStand = z.infer<typeof schemas.airdromeStand>
type TerminalType = 40 | 68 | 72 | 100 | 104
type SurveyedStand = readonly [crossroadIndex: number, type: TerminalType, x: number, y: number]

const terminalCapabilities: Record<
  TerminalType,
  Pick<AirdromeStand, 'helicopter' | 'large' | 'plane' | 'shelter'>
> = {
  40: { helicopter: true, large: false, plane: false, shelter: false },
  68: { helicopter: false, large: false, plane: true, shelter: true },
  72: { helicopter: false, large: false, plane: true, shelter: false },
  100: { helicopter: false, large: false, plane: true, shelter: true },
  104: { helicopter: true, large: true, plane: true, shelter: false }
}

function standlist(stands: readonly SurveyedStand[]): Airdrome['standlist'] {
  return Object.fromEntries(
    stands.map(([crossroad_index, type, x, y], index) => {
      const id = (index + 1).toString().padStart(2, '0')
      return [
        id,
        {
          id,
          crossroad_index,
          x,
          y,
          ...terminalCapabilities[type]
        }
      ]
    })
  )
}

function airdrome(
  id: number,
  name: string,
  x: number,
  y: number,
  runwayAngle: number,
  stands: readonly SurveyedStand[]
): Airdrome {
  return { id, name, x, y, runwayAngle, standlist: standlist(stands) }
}

// Extracted in DCS World from the South Atlantic terrain on 2026-08-05.
// Terminal type 16 records are runway starts and are intentionally not parking stands.
export const airdromeDetails: Record<string, Airdrome> = {
  'Stanley Airport': airdrome(1, 'Stanley Airport', 89_009.43, 94_537.625, 91.215, [
    [2, 104, 88_872.891, 93_596.391],
    [3, 104, 88_874.156, 93_617.312],
    [4, 104, 88_874.789, 93_638.07],
    [5, 104, 88_875.391, 93_658.984],
    [6, 104, 88_862.609, 93_952.43],
    [7, 104, 88_843.453, 93_952.5],
    [8, 104, 88_821.219, 93_953.375],
    [9, 104, 88_793.125, 94_016.648],
    [10, 104, 88_774.039, 94_032.109],
    [11, 104, 88_752.516, 94_042.406],
    [12, 40, 89_159.555, 94_720.117],
    [13, 40, 89_159, 94_768.344],
    [14, 40, 89_198.031, 94_767.43],
    [15, 40, 89_198.086, 94_721.453],
    [16, 104, 88_880.531, 94_599.156],
    [17, 104, 88_906.82, 94_705.617]
  ]),
  'Rio Grande': airdrome(6, 'Rio Grande', -197_290.656, -560_378.75, 281.245, [
    [2, 104, -197_547.516, -559_618.625],
    [3, 104, -197_579.312, -559_850.812],
    [4, 104, -197_572.797, -559_820.625],
    [5, 104, -197_567.688, -559_791],
    [6, 104, -197_597.062, -559_748.25],
    [7, 104, -197_628.375, -559_741.75],
    [8, 104, -197_662.547, -559_734.5]
  ]),
  'Rio Gallegos': airdrome(5, 'Rio Gallegos', 26_083.363, -701_836.5, 104.164, [
    [0, 72, 26_473.5, -701_737.125],
    [1, 72, 26_535.213, -701_657.625],
    [2, 72, 26_615, -701_722.25],
    [3, 104, 26_682.455, -701_642.25],
    [4, 72, 26_471.986, -701_515.125],
    [5, 104, 25_492.902, -702_755],
    [6, 104, 25_504.277, -702_772.438],
    [7, 104, 25_524.754, -702_806.5],
    [8, 104, 25_514.367, -702_789.688],
    [9, 104, 25_535.209, -702_822.812],
    [10, 104, 25_545.555, -702_839.938],
    [11, 104, 25_555.934, -702_856.688],
    [12, 104, 25_645.354, -702_559.125],
    [13, 104, 25_662.344, -702_489.375],
    [14, 72, 25_722.125, -702_180.312],
    [15, 40, 26_078.062, -703_388.812],
    [17, 40, 26_049.16, -703_351.125],
    [19, 72, 26_828.754, -701_285.875],
    [20, 104, 26_817.027, -701_313.812],
    [21, 104, 26_806.57, -701_339.25],
    [22, 104, 26_747.342, -701_310.375],
    [23, 104, 26_769.15, -701_260.938],
    [24, 104, 26_758.289, -701_285.375],
    [25, 40, 26_165.016, -702_249.812]
  ]),
  'San Julian': airdrome(11, 'San Julian', 297_758.406, -636_012.375, 109.034, [
    [2, 72, 298_061.062, -636_079.75],
    [3, 72, 298_060.875, -636_063.375],
    [4, 72, 298_010.344, -636_066.375],
    [5, 72, 298_019.344, -636_051.812],
    [6, 72, 297_940.281, -636_279.812],
    [7, 72, 297_941.281, -636_262.562],
    [8, 72, 297_980.219, -636_298.875],
    [9, 72, 297_991.031, -636_286.438],
    [10, 104, 297_276.906, -636_815.25]
  ])
}
