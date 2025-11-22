import { getScenarios } from './get-scenarios'

export function getScenario(id: string) {
  const scenarios = getScenarios()
  return scenarios.find((scenario) => scenario.id === id) ?? null
}
