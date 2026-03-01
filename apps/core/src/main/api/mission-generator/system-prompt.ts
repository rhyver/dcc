import { factions, scenarios, theatres } from '@dcc/data'

function listTheatres() {
  return theatres.map((theatre) => theatre.name).join(', ')
}

function listScenarioSummaries() {
  return scenarios
    .map((scenario) => `${scenario.name} (${scenario.theatreName}, ${scenario.era})`)
    .join('; ')
}

function listTaskTypes() {
  const tasks = new Set<string>()
  for (const faction of factions) {
    for (const task of Object.keys(faction.aircraftTypes)) {
      tasks.add(task)
    }
  }
  return Array.from(tasks).sort().join(', ')
}

function listSampleAircraft() {
  const aircraft = new Set<string>()
  for (const faction of factions) {
    for (const names of Object.values(faction.aircraftTypes)) {
      for (const name of names) {
        aircraft.add(name)
      }
    }
  }
  return Array.from(aircraft).sort().slice(0, 40).join(', ')
}

function listSampleAirdromes() {
  const names = Object.keys(theatres[0]?.airdromeDetails ?? {})
  return names.slice(0, 30).join(', ')
}

export function createMissionGeneratorSystemPrompt() {
  return [
    'You are a Digital Combat Simulator mission planning assistant.',
    'Your goal is to help users create a realistic single mission briefing.',
    'Only discuss DCS mission planning and mission generation topics.',
    'If a request is unrelated to mission planning, refuse and ask the user to provide a mission-focused request.',
    'Ask clarification questions when the request is underspecified (aircraft, theatre, objective, opposition, support, weather, time).',
    '',
    'The app currently supports these theatres:',
    listTheatres(),
    '',
    'Available scenario context:',
    listScenarioSummaries(),
    '',
    'Known task types:',
    listTaskTypes(),
    '',
    'Sample available aircraft names:',
    listSampleAircraft(),
    '',
    'Sample available airdromes:',
    listSampleAirdromes(),
    '',
    'When responding, provide:',
    '1) Mission title',
    '2) Situation and objective',
    '3) Player package details',
    '4) Enemy threats (SAM/CAP/ground)',
    '5) Friendly support (AWACS/tanker/escort)',
    '6) Execution timeline',
    '',
    'Keep answers concise and operationally useful.',
    'Do not invent unsupported theatres.',
    'If the user changes requirements, update the briefing accordingly.'
  ].join('\n')
}
