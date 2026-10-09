import { createStore } from '@xstate/store'

export const defaultMapLayers = {
  airdromes: true,
  towns: false,
  flights: true,
  ground: true,
  naval: true,
  structures: true,
  sam: true,
  ewr: true,
  pilots: true,
  frontline: true,
  samRange: true
}

export type MapLayerKey = keyof typeof defaultMapLayers

export const uiStore = createStore({
  context: {
    isLogOpen: false,
    showAtoPackages: false,
    showLogistics: false,
    mapLayers: { ...defaultMapLayers }
  },
  on: {
    toggleLog: (context) => ({ ...context, isLogOpen: !context.isLogOpen }),
    toggleAtoPackages: (context) => ({
      ...context,
      showAtoPackages: !context.showAtoPackages
    }),
    toggleLogistics: (context) => ({ ...context, showLogistics: !context.showLogistics }),
    setMapLayer: (context, event: { layer: MapLayerKey; visible: boolean }) => ({
      ...context,
      mapLayers: { ...context.mapLayers, [event.layer]: event.visible }
    }),
    resetMapLayers: (context) => ({ ...context, mapLayers: { ...defaultMapLayers } })
  }
})
