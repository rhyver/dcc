import * as luaTable from '@dcc/lua-table'
import { describe, expect, test } from 'vitest'

import {
  createDoScriptAction,
  createDoScriptFileAction,
  createLoggedStartupAction,
  createStartupLogAction,
  createTriggerFunction,
  createTriggerFunctionMap,
  createTriggerOnceAction,
  toLuaLongStringLiteral
} from './mission-config-trigger'

describe('mission config trigger action', () => {
  test('serializes as valid mission Lua after the trigger action is stringified', () => {
    const configScript =
      'config = {["missionId"]="abc",["flightGroups"]={[1]={["name"]="Enfield-9",["task"]="CAS"}}}'
    const action = createDoScriptAction(configScript)

    expect(action).toBe(`a_do_script([[${configScript}]])`)

    const missionLuaResult = luaTable.stringify(
      { trig: { actions: { 1: action } } },
      { mixedKeyTypes: true }
    )

    expect(missionLuaResult.isOk()).toBe(true)
    if (missionLuaResult.isErr()) {
      throw missionLuaResult.error
    }

    expect(missionLuaResult.value).toContain('a_do_script([[config = {[\\"missionId\\"]')
    expect(missionLuaResult.value).not.toContain('a_do_script(\\"config =')
    expect(missionLuaResult.value).not.toContain('[\\\\"missionId\\\\"]')
  })

  test('uses a longer Lua long-string delimiter when needed', () => {
    expect(toLuaLongStringLiteral('x]]y')).toBe('[=[x]]y]=]')
    expect(toLuaLongStringLiteral('x]]y]=]z')).toBe('[==[x]]y]=]z]==]')
  })

  test('creates old-style script file actions with startup logging', () => {
    const fileAction = createDoScriptFileAction('ResKey_Action_8')

    expect(fileAction).toBe('a_do_script_file(getValueResourceByKey("ResKey_Action_8"))')
    expect(createStartupLogAction('Loading "state"')).toBe(
      'if log and log.write then log.write("DCC.STARTUP", log.INFO or 3, "Loading \\"state\\"") end'
    )
    expect(createLoggedStartupAction('Loading state', fileAction)).toBe(
      'if log and log.write then log.write("DCC.STARTUP", log.INFO or 3, "Loading state") end; a_do_script_file(getValueResourceByKey("ResKey_Action_8"));'
    )
  })

  test('creates the runtime function that DCS needs to execute the trigger', () => {
    expect(createTriggerFunction(3)).toBe(
      'if mission.trig.conditions[3]() then mission.trig.actions[3]() end'
    )
  })

  test('creates the startup function table used by triggerStart script loaders', () => {
    expect(createTriggerFunctionMap([1, 3])).toEqual({
      1: 'if mission.trig.conditions[1]() then mission.trig.actions[1]() end',
      3: 'if mission.trig.conditions[3]() then mission.trig.actions[3]() end'
    })
  })

  test('creates a trigger-once action that disables itself after execution', () => {
    expect(createTriggerOnceAction('a_do_script_file(getValueResourceByKey("state"))', 3)).toBe(
      'a_do_script_file(getValueResourceByKey("state")); mission.trig.func[3]=nil;'
    )
  })
})
