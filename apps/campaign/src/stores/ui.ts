import { createStore } from '@xstate/store'

export const uiStore = createStore({
  context: {
    isLogOpen: false
  },
  on: {
    toggleLog: (context) => ({ ...context, isLogOpen: !context.isLogOpen })
  }
})
