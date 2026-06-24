import { createStore } from '@xstate/store'

export const uiStore = createStore({
  context: {
    isLogOpen: false,
    showAtoPackages: false,
    showLogistics: false
  },
  on: {
    toggleLog: (context) => ({ ...context, isLogOpen: !context.isLogOpen }),
    toggleAtoPackages: (context) => ({
      ...context,
      showAtoPackages: !context.showAtoPackages
    }),
    toggleLogistics: (context) => ({ ...context, showLogistics: !context.showLogistics })
  }
})
