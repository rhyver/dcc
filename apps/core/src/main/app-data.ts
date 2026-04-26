import { app } from 'electron'
import path from 'path'

app.setName('DCC')

export const appDataRoot = app.getPath('userData')
export const stateFile = path.join(appDataRoot, 'state.json')
export const campaignsDir = path.join(appDataRoot, 'campaigns')
export const missionBriefingsDir = path.join(appDataRoot, 'mission-briefings')
