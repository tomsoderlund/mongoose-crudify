module.exports = {
  addHooks
}

function addHooks (target, hookType, hooks, allActionKeys) {
  if (!target[hookType]) {
    target[hookType] = {}
    allActionKeys.forEach(actionName => {
      target[hookType][actionName] = []
    })
  }

  hooks.forEach(hook => {
    let actionsNeedHook = allActionKeys
    if (hook.only) {
      actionsNeedHook = hook.only
    } else if (hook.except) {
      actionsNeedHook = actionsNeedHook
        .filter(actionName => !hook.except.includes(actionName))
    }
    // add hook to all actions
    actionsNeedHook.forEach(actionName => {
      target[hookType][actionName] =
        target[hookType][actionName].concat(hook.middlewares)
    })
  })
}
