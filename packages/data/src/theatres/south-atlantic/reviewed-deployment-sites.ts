export type ReviewedDeploymentSiteKind =
  | 'vehicle'
  | 'airDefense'
  | 'recovery'
  | 'infantry'
  | 'reserve'

export interface ReviewedDeploymentSite {
  objectiveId: string
  kind: ReviewedDeploymentSiteKind
  position: { x: number; y: number }
  slots: Array<{ x: number; y: number; heading: number }>
}

export const reviewedDeploymentSites: ReviewedDeploymentSite[] = [
  {
    objectiveId: 'Port Stanley',
    kind: 'vehicle',
    position: { x: 87607, y: 87829 },
    slots: [
      { x: 87677, y: 87829, heading: 0 },
      { x: 87656.5, y: 87878.5, heading: 0.785398 },
      { x: 87611.597384, y: 87927.998882, heading: 1.524391 },
      { x: 87554.317196, y: 87908.913462, heading: 2.153645 },
      { x: 87500.92822, y: 87830.060935, heading: 3.131591 },
      { x: 87557.5, y: 87779.5, heading: 3.926991 },
      { x: 87619.731216, y: 87737.781306, heading: 4.851061 },
      { x: 87656.5, y: 87779.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Port Stanley',
    kind: 'airDefense',
    position: { x: 87807, y: 87029 },
    slots: [
      { x: 87899.626512, y: 87015.969884, heading: 6.143429 },
      { x: 87865.958722, y: 87095.197675, heading: 0.843173 },
      { x: 87809.412984, y: 87089.292522, heading: 1.530796 },
      { x: 87748.523875, y: 87080.237172, heading: 2.42208 },
      { x: 87724.990619, y: 87028.517403, heading: 3.147477 },
      { x: 87742.250116, y: 86956.528566, heading: 3.983202 },
      { x: 87806.034806, y: 86956.642556, heading: 4.699051 },
      { x: 87868.371706, y: 86954.115581, heading: 5.398939 }
    ]
  },
  {
    objectiveId: 'Port Stanley',
    kind: 'recovery',
    position: { x: 87007, y: 87529 },
    slots: [
      { x: 87087, y: 87529, heading: 0 },
      { x: 87055.006434, y: 87559.879302, heading: 0.571603 },
      { x: 87011.281783, y: 87586.061877, heading: 1.495899 },
      { x: 86967.557132, y: 87553.762469, heading: 2.580978 },
      { x: 86955.137431, y: 87521.965642, heading: 3.276405 },
      { x: 86956.852675, y: 87469.677425, heading: 4.010611 },
      { x: 87014.3402, y: 87459.704458, heading: 4.817921 },
      { x: 87063.57, y: 87472.43, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Stanley Airport',
    kind: 'vehicle',
    position: { x: 89148, y: 94385 },
    slots: [
      { x: 89218, y: 94385, heading: 0 },
      { x: 89197.5, y: 94434.5, heading: 0.785398 },
      { x: 89148, y: 94455, heading: 1.570796 },
      { x: 89098.5, y: 94434.5, heading: 2.356194 },
      { x: 89090.128606, y: 94385.898415, heading: 3.12607 },
      { x: 89098.5, y: 94335.5, heading: 3.926991 },
      { x: 89148, y: 94315, heading: 4.712389 },
      { x: 89197.5, y: 94335.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Stanley Airport',
    kind: 'airDefense',
    position: { x: 89048, y: 92985 },
    slots: [
      { x: 89118, y: 92985, heading: 0 },
      { x: 89097.5, y: 93034.5, heading: 0.785398 },
      { x: 89056.499063, y: 93055.849906, heading: 1.451408 },
      { x: 89056.293632, y: 92999.937142, heading: 1.063942 },
      { x: 89054.491571, y: 92959.219507, heading: 4.959063 },
      { x: 89008.415574, y: 92904.620069, heading: 4.254786 },
      { x: 89048, y: 92915, heading: 4.712389 },
      { x: 89097.5, y: 92935.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Stanley Airport',
    kind: 'recovery',
    position: { x: 89548, y: 93385 },
    slots: [
      { x: 89618, y: 93385, heading: 0 },
      { x: 89597.5, y: 93434.5, heading: 0.785398 },
      { x: 89548, y: 93455, heading: 1.570796 },
      { x: 89498.5, y: 93434.5, heading: 2.356194 },
      { x: 89478, y: 93385, heading: 3.141593 },
      { x: 89498.5, y: 93335.5, heading: 3.926991 },
      { x: 89548, y: 93315, heading: 4.712389 },
      { x: 89597.5, y: 93335.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'San Carlos',
    kind: 'vehicle',
    position: { x: 98395, y: 7483 },
    slots: [
      { x: 98465, y: 7483, heading: 0 },
      { x: 98444.5, y: 7532.5, heading: 0.785398 },
      { x: 98405.629219, y: 7534.171099, heading: 1.36599 },
      { x: 98369.795357, y: 7521.263397, heading: 2.153273 },
      { x: 98352.93966, y: 7480.570464, heading: 3.199292 },
      { x: 98361.595674, y: 7438.055379, heading: 4.073233 },
      { x: 98398.340612, y: 7429.095674, heading: 4.774283 },
      { x: 98444.5, y: 7433.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'San Carlos',
    kind: 'airDefense',
    position: { x: 99695, y: 7083 },
    slots: [
      { x: 99761.24002, y: 7084.005977, heading: 0.015186 },
      { x: 99772.8, y: 7160.8, heading: 0.785398 },
      { x: 99696.005977, y: 7178.41334, heading: 1.560253 },
      { x: 99617.2, y: 7160.8, heading: 2.356194 },
      { x: 99585, y: 7083, heading: 3.141593 },
      { x: 99628.265742, y: 7005.702988, heading: 4.000196 },
      { x: 99678.904375, y: 6979.035859, heading: 4.558789 },
      { x: 99772.8, y: 7005.2, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'San Carlos',
    kind: 'recovery',
    position: { x: 99695, y: 7883 },
    slots: [
      { x: 99796.100772, y: 7917.33346, heading: 0.327377 },
      { x: 99751.6, y: 7939.6, heading: 0.785398 },
      { x: 99719.610188, y: 8022.692797, heading: 1.396412 },
      { x: 99638.4, y: 7939.6, heading: 2.356194 },
      { x: 99615, y: 7883, heading: 3.141593 },
      { x: 99638.4, y: 7826.4, heading: 3.926991 },
      { x: 99695, y: 7803, heading: 4.712389 },
      { x: 99735.506191, y: 7863.952222, heading: 5.843625 }
    ]
  },
  {
    objectiveId: 'Port San Carlos',
    kind: 'vehicle',
    position: { x: 108023, y: 8908 },
    slots: [
      { x: 108093, y: 8908, heading: 0 },
      { x: 108072.5, y: 8957.5, heading: 0.785398 },
      { x: 108023, y: 8978, heading: 1.570796 },
      { x: 107973.5, y: 8957.5, heading: 2.356194 },
      { x: 107953, y: 8908, heading: 3.141593 },
      { x: 107973.5, y: 8858.5, heading: 3.926991 },
      { x: 108023, y: 8838, heading: 4.712389 },
      { x: 108072.5, y: 8858.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Port San Carlos',
    kind: 'airDefense',
    position: { x: 108123, y: 8308 },
    slots: [
      { x: 108193, y: 8308, heading: 0 },
      { x: 108172.5, y: 8357.5, heading: 0.785398 },
      { x: 108123, y: 8378, heading: 1.570796 },
      { x: 108073.5, y: 8357.5, heading: 2.356194 },
      { x: 108053, y: 8308, heading: 3.141593 },
      { x: 108073.5, y: 8258.5, heading: 3.926991 },
      { x: 108123, y: 8238, heading: 4.712389 },
      { x: 108172.5, y: 8258.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Port San Carlos',
    kind: 'recovery',
    position: { x: 108323, y: 8708 },
    slots: [
      { x: 108393, y: 8708, heading: 0 },
      { x: 108372.5, y: 8757.5, heading: 0.785398 },
      { x: 108323, y: 8778, heading: 1.570796 },
      { x: 108273.5, y: 8757.5, heading: 2.356194 },
      { x: 108253, y: 8708, heading: 3.141593 },
      { x: 108273.5, y: 8658.5, heading: 3.926991 },
      { x: 108323, y: 8638, heading: 4.712389 },
      { x: 108372.5, y: 8658.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Darwin',
    kind: 'vehicle',
    position: { x: 76698, y: 12776 },
    slots: [
      { x: 76768, y: 12776, heading: 0 },
      { x: 76747.5, y: 12825.5, heading: 0.785398 },
      { x: 76698, y: 12846, heading: 1.570796 },
      { x: 76648.5, y: 12825.5, heading: 2.356194 },
      { x: 76628, y: 12776, heading: 3.141593 },
      { x: 76648.5, y: 12726.5, heading: 3.926991 },
      { x: 76698, y: 12706, heading: 4.712389 },
      { x: 76747.5, y: 12726.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Darwin',
    kind: 'airDefense',
    position: { x: 77398, y: 12976 },
    slots: [
      { x: 77468, y: 12976, heading: 0 },
      { x: 77447.5, y: 13025.5, heading: 0.785398 },
      { x: 77398, y: 13046, heading: 1.570796 },
      { x: 77348.5, y: 13025.5, heading: 2.356194 },
      { x: 77328, y: 12976, heading: 3.141593 },
      { x: 77348.5, y: 12926.5, heading: 3.926991 },
      { x: 77398, y: 12906, heading: 4.712389 },
      { x: 77447.5, y: 12926.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Goose Green',
    kind: 'vehicle',
    position: { x: 72475, y: 11539 },
    slots: [
      { x: 72545, y: 11539, heading: 0 },
      { x: 72524.5, y: 11588.5, heading: 0.785398 },
      { x: 72475, y: 11609, heading: 1.570796 },
      { x: 72425.5, y: 11588.5, heading: 2.356194 },
      { x: 72405, y: 11539, heading: 3.141593 },
      { x: 72425.5, y: 11489.5, heading: 3.926991 },
      { x: 72475, y: 11469, heading: 4.712389 },
      { x: 72524.5, y: 11489.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Goose Green',
    kind: 'airDefense',
    position: { x: 71775, y: 10639 },
    slots: [
      { x: 71845, y: 10639, heading: 0 },
      { x: 71824.5, y: 10688.5, heading: 0.785398 },
      { x: 71775, y: 10709, heading: 1.570796 },
      { x: 71725.5, y: 10688.5, heading: 2.356194 },
      { x: 71705, y: 10639, heading: 3.141593 },
      { x: 71725.5, y: 10589.5, heading: 3.926991 },
      { x: 71775, y: 10569, heading: 4.712389 },
      { x: 71824.5, y: 10589.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Goose Green',
    kind: 'recovery',
    position: { x: 71475, y: 11139 },
    slots: [
      { x: 71545, y: 11139, heading: 0 },
      { x: 71524.5, y: 11188.5, heading: 0.785398 },
      { x: 71475, y: 11209, heading: 1.570796 },
      { x: 71425.5, y: 11188.5, heading: 2.356194 },
      { x: 71405, y: 11139, heading: 3.141593 },
      { x: 71425.5, y: 11089.5, heading: 3.926991 },
      { x: 71475, y: 11069, heading: 4.712389 },
      { x: 71524.5, y: 11089.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Fox Bay',
    kind: 'vehicle',
    position: { x: 54944, y: -61754 },
    slots: [
      { x: 55014, y: -61754, heading: 0 },
      { x: 54993.5, y: -61704.5, heading: 0.785398 },
      { x: 54944, y: -61684, heading: 1.570796 },
      { x: 54894.5, y: -61704.5, heading: 2.356194 },
      { x: 54874, y: -61754, heading: 3.141593 },
      { x: 54894.5, y: -61803.5, heading: 3.926991 },
      { x: 54944, y: -61824, heading: 4.712389 },
      { x: 54993.5, y: -61803.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Fox Bay',
    kind: 'airDefense',
    position: { x: 54744, y: -62354 },
    slots: [
      { x: 54814, y: -62354, heading: 0 },
      { x: 54793.5, y: -62304.5, heading: 0.785398 },
      { x: 54744, y: -62284, heading: 1.570796 },
      { x: 54694.5, y: -62304.5, heading: 2.356194 },
      { x: 54674, y: -62354, heading: 3.141593 },
      { x: 54694.5, y: -62403.5, heading: 3.926991 },
      { x: 54744, y: -62424, heading: 4.712389 },
      { x: 54793.5, y: -62403.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Port Howard',
    kind: 'vehicle',
    position: { x: 94257, y: -27383 },
    slots: [
      { x: 94327, y: -27383, heading: 0 },
      { x: 94306.5, y: -27333.5, heading: 0.785398 },
      { x: 94257, y: -27313, heading: 1.570796 },
      { x: 94207.5, y: -27333.5, heading: 2.356194 },
      { x: 94187, y: -27383, heading: 3.141593 },
      { x: 94207.5, y: -27432.5, heading: 3.926991 },
      { x: 94257, y: -27453, heading: 4.712389 },
      { x: 94306.5, y: -27432.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Port Howard',
    kind: 'airDefense',
    position: { x: 94657, y: -27783 },
    slots: [
      { x: 94727, y: -27783, heading: 0 },
      { x: 94706.5, y: -27733.5, heading: 0.785398 },
      { x: 94657, y: -27713, heading: 1.570796 },
      { x: 94607.5, y: -27733.5, heading: 2.356194 },
      { x: 94587, y: -27783, heading: 3.141593 },
      { x: 94607.5, y: -27832.5, heading: 3.926991 },
      { x: 94657, y: -27853, heading: 4.712389 },
      { x: 94706.5, y: -27832.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Evelyn Station Farm',
    kind: 'vehicle',
    position: { x: 102435, y: 47581 },
    slots: [
      { x: 102505, y: 47581, heading: 0 },
      { x: 102484.5, y: 47630.5, heading: 0.785398 },
      { x: 102435, y: 47651, heading: 1.570796 },
      { x: 102385.5, y: 47630.5, heading: 2.356194 },
      { x: 102365, y: 47581, heading: 3.141593 },
      { x: 102385.5, y: 47531.5, heading: 3.926991 },
      { x: 102435, y: 47511, heading: 4.712389 },
      { x: 102484.5, y: 47531.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Evelyn Station Farm',
    kind: 'airDefense',
    position: { x: 103235, y: 47181 },
    slots: [
      { x: 103305, y: 47181, heading: 0 },
      { x: 103284.5, y: 47230.5, heading: 0.785398 },
      { x: 103235, y: 47251, heading: 1.570796 },
      { x: 103185.5, y: 47230.5, heading: 2.356194 },
      { x: 103165, y: 47181, heading: 3.141593 },
      { x: 103185.5, y: 47131.5, heading: 3.926991 },
      { x: 103235, y: 47111, heading: 4.712389 },
      { x: 103284.5, y: 47131.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Mount Kent',
    kind: 'vehicle',
    position: { x: 91608, y: 70972 },
    slots: [
      { x: 91678, y: 70972, heading: 0 },
      { x: 91657.5, y: 71021.5, heading: 0.785398 },
      { x: 91608, y: 71042, heading: 1.570796 },
      { x: 91558.5, y: 71021.5, heading: 2.356194 },
      { x: 91538, y: 70972, heading: 3.141593 },
      { x: 91558.5, y: 70922.5, heading: 3.926991 },
      { x: 91608, y: 70902, heading: 4.712389 },
      { x: 91657.5, y: 70922.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Mount Kent',
    kind: 'airDefense',
    position: { x: 91608, y: 71572 },
    slots: [
      { x: 91678, y: 71572, heading: 0 },
      { x: 91657.5, y: 71621.5, heading: 0.785398 },
      { x: 91608, y: 71642, heading: 1.570796 },
      { x: 91558.5, y: 71621.5, heading: 2.356194 },
      { x: 91538, y: 71572, heading: 3.141593 },
      { x: 91558.5, y: 71522.5, heading: 3.926991 },
      { x: 91608, y: 71502, heading: 4.712389 },
      { x: 91657.5, y: 71522.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Two Sisters',
    kind: 'infantry',
    position: { x: 87685, y: 65993 },
    slots: [
      { x: 87755, y: 65993, heading: 0 },
      { x: 87734.5, y: 66042.5, heading: 0.785398 },
      { x: 87685, y: 66063, heading: 1.570796 },
      { x: 87635.5, y: 66042.5, heading: 2.356194 },
      { x: 87615, y: 65993, heading: 3.141593 },
      { x: 87635.5, y: 65943.5, heading: 3.926991 },
      { x: 87685, y: 65923, heading: 4.712389 },
      { x: 87734.5, y: 65943.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Two Sisters',
    kind: 'reserve',
    position: { x: 87685, y: 66693 },
    slots: [
      { x: 87755, y: 66693, heading: 0 },
      { x: 87734.5, y: 66742.5, heading: 0.785398 },
      { x: 87685, y: 66763, heading: 1.570796 },
      { x: 87635.5, y: 66742.5, heading: 2.356194 },
      { x: 87615, y: 66693, heading: 3.141593 },
      { x: 87635.5, y: 66643.5, heading: 3.926991 },
      { x: 87685, y: 66623, heading: 4.712389 },
      { x: 87734.5, y: 66643.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Mount Longdon',
    kind: 'vehicle',
    position: { x: 91617, y: 70318 },
    slots: [
      { x: 91687, y: 70318, heading: 0 },
      { x: 91666.5, y: 70367.5, heading: 0.785398 },
      { x: 91617, y: 70388, heading: 1.570796 },
      { x: 91567.5, y: 70367.5, heading: 2.356194 },
      { x: 91547, y: 70318, heading: 3.141593 },
      { x: 91567.5, y: 70268.5, heading: 3.926991 },
      { x: 91617, y: 70248, heading: 4.712389 },
      { x: 91666.5, y: 70268.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Mount Longdon',
    kind: 'airDefense',
    position: { x: 92217, y: 68918 },
    slots: [
      { x: 92287, y: 68918, heading: 0 },
      { x: 92266.5, y: 68967.5, heading: 0.785398 },
      { x: 92217, y: 68988, heading: 1.570796 },
      { x: 92167.5, y: 68967.5, heading: 2.356194 },
      { x: 92147, y: 68918, heading: 3.141593 },
      { x: 92167.5, y: 68868.5, heading: 3.926991 },
      { x: 92217, y: 68848, heading: 4.712389 },
      { x: 92266.5, y: 68868.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Wireless Ridge',
    kind: 'vehicle',
    position: { x: 91227, y: 83145 },
    slots: [
      { x: 91297, y: 83145, heading: 0 },
      { x: 91276.5, y: 83194.5, heading: 0.785398 },
      { x: 91227, y: 83215, heading: 1.570796 },
      { x: 91177.5, y: 83194.5, heading: 2.356194 },
      { x: 91157, y: 83145, heading: 3.141593 },
      { x: 91177.5, y: 83095.5, heading: 3.926991 },
      { x: 91227, y: 83075, heading: 4.712389 },
      { x: 91276.5, y: 83095.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Wireless Ridge',
    kind: 'airDefense',
    position: { x: 90227, y: 82845 },
    slots: [
      { x: 90297, y: 82845, heading: 0 },
      { x: 90254.477608, y: 82864.035691, heading: 0.605858 },
      { x: 90254.16095, y: 82917.936319, heading: 1.214314 },
      { x: 90177.5, y: 82894.5, heading: 2.356194 },
      { x: 90157, y: 82845, heading: 3.141593 },
      { x: 90177.5, y: 82795.5, heading: 3.926991 },
      { x: 90243.883834, y: 82755.913927, heading: 4.89969 },
      { x: 90299.623511, y: 82794.031841, heading: 5.671243 }
    ]
  },
  {
    objectiveId: 'Mount Tumbledown',
    kind: 'vehicle',
    position: { x: 86986, y: 81520 },
    slots: [
      { x: 87056, y: 81520, heading: 0 },
      { x: 87035.5, y: 81569.5, heading: 0.785398 },
      { x: 86986, y: 81590, heading: 1.570796 },
      { x: 86936.5, y: 81569.5, heading: 2.356194 },
      { x: 86916, y: 81520, heading: 3.141593 },
      { x: 86936.5, y: 81470.5, heading: 3.926991 },
      { x: 86986, y: 81450, heading: 4.712389 },
      { x: 87035.5, y: 81470.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Mount Tumbledown',
    kind: 'airDefense',
    position: { x: 86386, y: 80820 },
    slots: [
      { x: 86456, y: 80820, heading: 0 },
      { x: 86435.5, y: 80869.5, heading: 0.785398 },
      { x: 86386, y: 80890, heading: 1.570796 },
      { x: 86336.5, y: 80869.5, heading: 2.356194 },
      { x: 86316, y: 80820, heading: 3.141593 },
      { x: 86336.5, y: 80770.5, heading: 3.926991 },
      { x: 86386, y: 80750, heading: 4.712389 },
      { x: 86435.5, y: 80770.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Fitzroy',
    kind: 'vehicle',
    position: { x: 76519, y: 62407 },
    slots: [
      { x: 76589, y: 62407, heading: 0 },
      { x: 76568.5, y: 62456.5, heading: 0.785398 },
      { x: 76519, y: 62477, heading: 1.570796 },
      { x: 76469.5, y: 62456.5, heading: 2.356194 },
      { x: 76449, y: 62407, heading: 3.141593 },
      { x: 76469.5, y: 62357.5, heading: 3.926991 },
      { x: 76519, y: 62337, heading: 4.712389 },
      { x: 76568.5, y: 62357.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Fitzroy',
    kind: 'airDefense',
    position: { x: 77119, y: 61907 },
    slots: [
      { x: 77189, y: 61907, heading: 0 },
      { x: 77168.5, y: 61956.5, heading: 0.785398 },
      { x: 77119, y: 61977, heading: 1.570796 },
      { x: 77069.5, y: 61956.5, heading: 2.356194 },
      { x: 77049, y: 61907, heading: 3.141593 },
      { x: 77069.5, y: 61857.5, heading: 3.926991 },
      { x: 77119, y: 61837, heading: 4.712389 },
      { x: 77168.5, y: 61857.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Bluff Cove',
    kind: 'vehicle',
    position: { x: 81724, y: 65483 },
    slots: [
      { x: 81794, y: 65483, heading: 0 },
      { x: 81773.5, y: 65532.5, heading: 0.785398 },
      { x: 81724, y: 65553, heading: 1.570796 },
      { x: 81674.5, y: 65532.5, heading: 2.356194 },
      { x: 81654, y: 65483, heading: 3.141593 },
      { x: 81674.5, y: 65433.5, heading: 3.926991 },
      { x: 81724, y: 65413, heading: 4.712389 },
      { x: 81773.5, y: 65433.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Bluff Cove',
    kind: 'airDefense',
    position: { x: 82324, y: 65583 },
    slots: [
      { x: 82394, y: 65583, heading: 0 },
      { x: 82373.5, y: 65632.5, heading: 0.785398 },
      { x: 82324, y: 65653, heading: 1.570796 },
      { x: 82274.5, y: 65632.5, heading: 2.356194 },
      { x: 82254, y: 65583, heading: 3.141593 },
      { x: 82274.5, y: 65533.5, heading: 3.926991 },
      { x: 82324, y: 65513, heading: 4.712389 },
      { x: 82373.5, y: 65533.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Rio Grande',
    kind: 'vehicle',
    position: { x: -196852, y: -559954 },
    slots: [
      { x: -196782, y: -559954, heading: 0 },
      { x: -196802.5, y: -559904.5, heading: 0.785398 },
      { x: -196852, y: -559884, heading: 1.570796 },
      { x: -196901.5, y: -559904.5, heading: 2.356194 },
      { x: -196922, y: -559954, heading: 3.141593 },
      { x: -196901.5, y: -560003.5, heading: 3.926991 },
      { x: -196852, y: -560024, heading: 4.712389 },
      { x: -196802.5, y: -560003.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Rio Grande',
    kind: 'airDefense',
    position: { x: -197152, y: -558554 },
    slots: [
      { x: -197082, y: -558554, heading: 0 },
      { x: -197102.5, y: -558504.5, heading: 0.785398 },
      { x: -197152, y: -558484, heading: 1.570796 },
      { x: -197201.5, y: -558504.5, heading: 2.356194 },
      { x: -197222, y: -558554, heading: 3.141593 },
      { x: -197201.5, y: -558603.5, heading: 3.926991 },
      { x: -197152, y: -558624, heading: 4.712389 },
      { x: -197102.5, y: -558603.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Rio Grande',
    kind: 'recovery',
    position: { x: -197652, y: -559154 },
    slots: [
      { x: -197582, y: -559154, heading: 0 },
      { x: -197602.5, y: -559104.5, heading: 0.785398 },
      { x: -197652, y: -559084, heading: 1.570796 },
      { x: -197701.5, y: -559104.5, heading: 2.356194 },
      { x: -197722, y: -559154, heading: 3.141593 },
      { x: -197701.5, y: -559203.5, heading: 3.926991 },
      { x: -197652, y: -559224, heading: 4.712389 },
      { x: -197602.5, y: -559203.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Rio Gallegos',
    kind: 'vehicle',
    position: { x: 25309, y: -703830 },
    slots: [
      { x: 25379, y: -703830, heading: 0 },
      { x: 25358.5, y: -703780.5, heading: 0.785398 },
      { x: 25309, y: -703760, heading: 1.570796 },
      { x: 25259.5, y: -703780.5, heading: 2.356194 },
      { x: 25239, y: -703830, heading: 3.141593 },
      { x: 25259.5, y: -703879.5, heading: 3.926991 },
      { x: 25309, y: -703900, heading: 4.712389 },
      { x: 25358.5, y: -703879.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Rio Gallegos',
    kind: 'airDefense',
    position: { x: 25809, y: -704330 },
    slots: [
      { x: 25879, y: -704330, heading: 0 },
      { x: 25858.5, y: -704280.5, heading: 0.785398 },
      { x: 25809, y: -704260, heading: 1.570796 },
      { x: 25759.5, y: -704280.5, heading: 2.356194 },
      { x: 25739, y: -704330, heading: 3.141593 },
      { x: 25759.5, y: -704379.5, heading: 3.926991 },
      { x: 25809, y: -704400, heading: 4.712389 },
      { x: 25858.5, y: -704379.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'Rio Gallegos',
    kind: 'recovery',
    position: { x: 26109, y: -702930 },
    slots: [
      { x: 26179, y: -702930, heading: 0 },
      { x: 26158.5, y: -702880.5, heading: 0.785398 },
      { x: 26109, y: -702860, heading: 1.570796 },
      { x: 26059.5, y: -702880.5, heading: 2.356194 },
      { x: 26039, y: -702930, heading: 3.141593 },
      { x: 26059.5, y: -702979.5, heading: 3.926991 },
      { x: 26109, y: -703000, heading: 4.712389 },
      { x: 26158.5, y: -702979.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'San Julian',
    kind: 'vehicle',
    position: { x: 297167, y: -636407 },
    slots: [
      { x: 297237, y: -636407, heading: 0 },
      { x: 297216.5, y: -636357.5, heading: 0.785398 },
      { x: 297167, y: -636337, heading: 1.570796 },
      { x: 297117.5, y: -636357.5, heading: 2.356194 },
      { x: 297097, y: -636407, heading: 3.141593 },
      { x: 297117.5, y: -636456.5, heading: 3.926991 },
      { x: 297167, y: -636477, heading: 4.712389 },
      { x: 297216.5, y: -636456.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'San Julian',
    kind: 'airDefense',
    position: { x: 297567, y: -636007 },
    slots: [
      { x: 297637, y: -636007, heading: 0 },
      { x: 297616.5, y: -635957.5, heading: 0.785398 },
      { x: 297567, y: -635937, heading: 1.570796 },
      { x: 297517.5, y: -635957.5, heading: 2.356194 },
      { x: 297497, y: -636007, heading: 3.141593 },
      { x: 297517.5, y: -636056.5, heading: 3.926991 },
      { x: 297567, y: -636077, heading: 4.712389 },
      { x: 297616.5, y: -636056.5, heading: 5.497787 }
    ]
  },
  {
    objectiveId: 'San Julian',
    kind: 'recovery',
    position: { x: 298067, y: -637207 },
    slots: [
      { x: 298137, y: -637207, heading: 0 },
      { x: 298116.5, y: -637157.5, heading: 0.785398 },
      { x: 298067, y: -637137, heading: 1.570796 },
      { x: 298017.5, y: -637157.5, heading: 2.356194 },
      { x: 297997, y: -637207, heading: 3.141593 },
      { x: 298017.5, y: -637256.5, heading: 3.926991 },
      { x: 298067, y: -637277, heading: 4.712389 },
      { x: 298116.5, y: -637256.5, heading: 5.497787 }
    ]
  }
]
