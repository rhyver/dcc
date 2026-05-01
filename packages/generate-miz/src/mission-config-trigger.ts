export function toLuaLongStringLiteral(value: string) {
  let delimiter = ''
  while (value.includes(`]${delimiter}]`)) {
    delimiter += '='
  }
  return `[${delimiter}[${value}]${delimiter}]`
}

export function createDoScriptAction(script: string) {
  return `a_do_script(${toLuaLongStringLiteral(script)})`
}

export function createDoScriptFileAction(resourceKey: string) {
  return `a_do_script_file(getValueResourceByKey("${resourceKey}"))`
}

export function createStartupLogAction(message: string) {
  const escapedMessage = message.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
  return `if log and log.write then log.write("DCC.STARTUP", log.INFO or 3, "${escapedMessage}") end`
}

export function createLoggedStartupAction(message: string, action: string) {
  return `${createStartupLogAction(message)}; ${action};`
}

export function createTriggerFunction(triggerIndex: number) {
  return `if mission.trig.conditions[${triggerIndex}]() then mission.trig.actions[${triggerIndex}]() end`
}

export function createTriggerFunctionMap(triggerIndexes: number[]) {
  const triggerFunctions: Record<number, string> = {}
  triggerIndexes.forEach((triggerIndex) => {
    triggerFunctions[triggerIndex] = createTriggerFunction(triggerIndex)
  })
  return triggerFunctions
}

export function createTriggerOnceAction(action: string, triggerIndex: number) {
  return `${action}; mission.trig.func[${triggerIndex}]=nil;`
}
