import { pub } from '../orpc'
import { getTheatre as getTheatreFn } from './get-theatre'
import { getScenario as getScenarioFn } from './get-scenario'

const getScenario = pub.data.getScenario.handler(async ({ input, errors }) => {
  const scenario = getScenarioFn(input)
  if (scenario == null) {
    throw errors.NOT_FOUND({ data: { message: 'Scenario not found', path: input } })
  }
  return scenario
})

const getTheatre = pub.data.getTheatre.handler(async ({ input, errors }) => {
  const theatre = getTheatreFn(input)
  if (theatre == null) {
    throw errors.NOT_FOUND({ data: { message: 'Theatre not found', path: input } })
  }
  return theatre
})

export const data = {
  getScenario,
  getTheatre
}
