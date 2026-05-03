import { DARK, layers, type Flavor } from '@protomaps/basemaps'
import type { LayerSpecification, StyleSpecification } from 'maplibre-gl'

const synthwaveFlavor: Flavor = {
  ...DARK,
  background: '#38285c',
  earth: '#47336a',
  park_a: '#564078',
  park_b: '#5b447c',
  hospital: '#604883',
  industrial: '#554078',
  school: '#604883',
  wood_a: '#4f3b70',
  wood_b: '#554076',
  pedestrian: '#5b417d',
  scrub_a: '#4f3b70',
  scrub_b: '#554076',
  glacier: '#6f5792',
  sand: '#6a4d88',
  beach: '#74568f',
  aerodrome: '#684c88',
  runway: '#8768a8',
  water: '#243a58',
  zoo: '#382658',
  military: '#46285a',
  buildings: '#6a4f86',
  pier: '#684c88',
  minor_service_casing: '#684c88',
  minor_casing: '#684c88',
  link_casing: '#684c88',
  major_casing_late: '#765996',
  highway_casing_late: '#8262a2',
  other: '#6a4f86',
  minor_service: '#6a4f86',
  minor_a: '#8768a8',
  minor_b: '#765996',
  link: '#8768a8',
  major_casing_early: '#8262a2',
  major: '#9b78bc',
  highway_casing_early: '#9f7ac4',
  highway: '#be92e2',
  railway: '#8768a8',
  boundaries: '#9f7ac4',
  bridges_other_casing: '#684c88',
  bridges_minor_casing: '#684c88',
  bridges_link_casing: '#684c88',
  bridges_major_casing: '#765996',
  bridges_highway_casing: '#8262a2',
  bridges_other: '#6a4f86',
  bridges_minor: '#8768a8',
  bridges_link: '#8768a8',
  bridges_major: '#9b78bc',
  bridges_highway: '#be92e2',
  roads_label_minor: '#c8b8e8',
  roads_label_minor_halo: '#2a1d48',
  roads_label_major: '#e0cff8',
  roads_label_major_halo: '#2a1d48',
  ocean_label: '#8090b6',
  subplace_label: '#d3def8',
  subplace_label_halo: '#2a1d48',
  city_label: '#f2f7ff',
  city_label_halo: '#2a1d48',
  state_label: '#c5d0ea',
  state_label_halo: '#2a1d48',
  country_label: '#edf4ff',
  address_label: '#c8b8e8',
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
