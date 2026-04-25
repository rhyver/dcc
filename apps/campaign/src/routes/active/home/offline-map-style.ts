import { LIGHT, layers } from '@protomaps/basemaps'
import type { LayerSpecification, StyleSpecification } from 'maplibre-gl'

const worldSource = 'protomaps-world'
const caucasusSource = 'protomaps-caucasus'
const worldPmtilesUrl = new URL('./maps/world-low.pmtiles', window.location.href).toString()
const caucasusPmtilesUrl = new URL('./maps/caucasus/caucasus.pmtiles', window.location.href).toString()

function prepareLayer(layer: LayerSpecification, source: string, minzoom?: number, maxzoom?: number) {
  const preparedLayer = {
    ...layer,
    id: `${source}-${layer.id}`,
    ...(minzoom == null ? {} : { minzoom }),
    ...(maxzoom == null ? {} : { maxzoom })
  }

  if (preparedLayer.type !== 'symbol' || !('layout' in preparedLayer) || preparedLayer.layout == null) {
    return preparedLayer
  }
  if (!('text-field' in preparedLayer.layout)) return preparedLayer
  if (preparedLayer.id.endsWith('address_label') || preparedLayer.id.endsWith('roads_shields')) {
    return preparedLayer
  }

  return {
    ...preparedLayer,
    layout: {
      ...preparedLayer.layout,
      'text-field': ['get', 'name:en'] as ['get', string]
    }
  }
}

function prepareLayers(source: string, minzoom?: number, maxzoom?: number) {
  return layers(source, LIGHT, { lang: 'en' }).map((layer) =>
    prepareLayer(layer, source, minzoom, maxzoom)
  )
}

const englishOnlyLayers = [
  ...prepareLayers(worldSource, undefined, 6),
  ...prepareLayers(caucasusSource, 6)
]

const layersWithEmptyEnglishLabels = englishOnlyLayers.map((layer) => {
  if (layer.type !== 'symbol' || !('layout' in layer) || layer.layout == null) return layer
  if (!('text-field' in layer.layout)) return layer
  if (layer.id.endsWith('address_label') || layer.id.endsWith('roads_shields')) return layer

  return {
    ...layer,
    layout: {
      ...layer.layout,
      'text-field': ['get', 'name:en'] as ['get', string]
    }
  }
})

export const offlineCaucasusMapStyle: StyleSpecification = {
  version: 8,
  glyphs: './maps/fonts/{fontstack}/{range}.pbf',
  sources: {
    [worldSource]: {
      type: 'vector',
      url: `pmtiles://${worldPmtilesUrl}`,
      attribution:
        '<a href="https://github.com/protomaps/basemaps">Protomaps</a> © <a href="https://osm.org/copyright">OpenStreetMap</a>',
      minzoom: 0,
      maxzoom: 5
    },
    [caucasusSource]: {
      type: 'vector',
      url: `pmtiles://${caucasusPmtilesUrl}`,
      attribution:
        '<a href="https://github.com/protomaps/basemaps">Protomaps</a> © <a href="https://osm.org/copyright">OpenStreetMap</a>',
      minzoom: 3,
      maxzoom: 10,
      bounds: [40.130612, 40.747635, 44.435577, 44.169509]
    }
  },
  layers: layersWithEmptyEnglishLabels
}
