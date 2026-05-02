import { DARK, layers, type Flavor } from '@protomaps/basemaps'
import type { LayerSpecification, StyleSpecification } from 'maplibre-gl'

const synthwaveFlavor: Flavor = {
  ...DARK,
  background: '#2a1d48',
  earth: '#332252',
  park_a: '#3c285e',
  park_b: '#3c285e',
  hospital: '#422c64',
  industrial: '#3c285e',
  school: '#422c64',
  wood_a: '#352455',
  wood_b: '#382658',
  pedestrian: '#3e2860',
  scrub_a: '#352455',
  scrub_b: '#382658',
  glacier: '#4a3268',
  sand: '#452e64',
  beach: '#452e64',
  aerodrome: '#452f66',
  runway: '#604280',
  water: '#243a58',
  zoo: '#382658',
  military: '#46285a',
  buildings: '#4c3268',
  pier: '#452f66',
  minor_service_casing: '#452f66',
  minor_casing: '#452f66',
  link_casing: '#452f66',
  major_casing_late: '#553a78',
  highway_casing_late: '#604288',
  other: '#4c3268',
  minor_service: '#4c3268',
  minor_a: '#604280',
  minor_b: '#553a78',
  link: '#604280',
  major_casing_early: '#604288',
  major: '#765098',
  highway_casing_early: '#7654a0',
  highway: '#9264c0',
  railway: '#604280',
  boundaries: '#7654a0',
  bridges_other_casing: '#452f66',
  bridges_minor_casing: '#452f66',
  bridges_link_casing: '#452f66',
  bridges_major_casing: '#553a78',
  bridges_highway_casing: '#604288',
  bridges_other: '#4c3268',
  bridges_minor: '#604280',
  bridges_link: '#604280',
  bridges_major: '#765098',
  bridges_highway: '#9264c0',
  roads_label_minor: '#a290c8',
  roads_label_minor_halo: '#2a1d48',
  roads_label_major: '#c2b0e0',
  roads_label_major_halo: '#2a1d48',
  ocean_label: '#8090b6',
  subplace_label: '#b2c0e0',
  subplace_label_halo: '#2a1d48',
  city_label: '#dce8ff',
  city_label_halo: '#2a1d48',
  state_label: '#a0b0d0',
  state_label_halo: '#2a1d48',
  country_label: '#cad8ee',
  address_label: '#a290c8',
  address_label_halo: '#2a1d48'
}

const worldSource = 'protomaps-world'
const caucasusSource = 'protomaps-caucasus'
const worldPmtilesUrl = new URL('./maps/world-low.pmtiles', window.location.href).toString()
const caucasusPmtilesUrl = new URL(
  './maps/caucasus/caucasus.pmtiles',
  window.location.href
).toString()
const caucasusDetailBounds: [number, number, number, number] = [
  40.130612, 40.747635, 44.435577, 44.169509
]
export const CAUCASUS_DETAIL_MAX_ZOOM = 12

function prepareLayer(
  layer: LayerSpecification,
  source: string,
  minzoom?: number,
  maxzoom?: number
) {
  const preparedLayer = {
    ...layer,
    id: `${source}-${layer.id}`,
    ...(minzoom == null ? {} : { minzoom }),
    ...(maxzoom == null ? {} : { maxzoom })
  }

  if (
    preparedLayer.type !== 'symbol' ||
    !('layout' in preparedLayer) ||
    preparedLayer.layout == null
  ) {
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

function prepareLayers(
  source: string,
  minzoom?: number,
  maxzoom?: number,
  options: { includeBackground?: boolean } = {}
) {
  return layers(source, synthwaveFlavor, { lang: 'en' })
    .filter((layer) => options.includeBackground !== false || layer.type !== 'background')
    .map((layer) => prepareLayer(layer, source, minzoom, maxzoom))
}

const englishOnlyLayers = [
  ...prepareLayers(worldSource),
  ...prepareLayers(caucasusSource, 6, undefined, { includeBackground: false })
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
      maxzoom: CAUCASUS_DETAIL_MAX_ZOOM,
      bounds: caucasusDetailBounds
    }
  },
  layers: layersWithEmptyEnglishLabels
}
