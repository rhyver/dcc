import 'maplibre-gl/dist/maplibre-gl.css'

import { useSelector } from '@xstate/store/react'
import { activeStore } from '@/stores/active'
import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc'
import { memo, useMemo, useState, useEffect } from 'react'
import { LOtoLL } from '@kilcekru/dcs-coordinates'
import * as z from 'zod'
import { schemas } from '@dcc/contracts'
import MaplibreMap, { Marker as MaplibreMarker, Source, Layer, useMap } from 'react-map-gl/maplibre'
import MilSymbol from 'milsymbol'
import * as turf from '@turf/turf'
import { getMilSymbolCode } from './unit-code'
import { type ObjectiveMarker as ObjectiveMarkerType, useMapItems } from './use-map-items'
import { cn } from '@/lib/utils'
import { DetailsCard } from './details-card'

const Marker = memo(function Marker({
  item,
  onClick,
  isSelected
}: {
  item: z.infer<typeof schemas.MapItem>
  onClick: () => void
  isSelected: boolean
}) {
  const symbol = useMemo(() => {
    const symbol = new MilSymbol.Symbol(getMilSymbolCode(item), {
      size: 20
    })
    return symbol.asSVG()
  }, [item])

  return (
    <MaplibreMarker
      longitude={item.position.lng}
      latitude={item.position.lat}
      anchor="center"
      onClick={(e) => {
        e.originalEvent.stopPropagation()
        onClick()
      }}
    >
      <div
        className={cn(
          'transition-all',
          isSelected && 'ring-2 ring-synthwave-pink rounded-full drop-shadow-md scale-110'
        )}
        dangerouslySetInnerHTML={{ __html: symbol }}
      />
    </MaplibreMarker>
  )
})

const ObjectiveCircleMarker = memo(function ObjectiveCircleMarker({
  marker,
  onClick,
  isSelected
}: {
  marker: ObjectiveMarkerType
  onClick: () => void
  isSelected: boolean
}) {
  const color = marker.coalition === 'player' ? 'var(--synthwave-cyan)' : 'var(--enemy-red)'
  return (
    <MaplibreMarker
      longitude={marker.position.lng}
      latitude={marker.position.lat}
      anchor="center"
      onClick={(e) => {
        e.originalEvent.stopPropagation()
        onClick()
      }}
    >
      <div
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded-full border-2 bg-black/70 transition-all',
          isSelected && 'ring-2 ring-white scale-125'
        )}
        style={{ borderColor: color }}
        title={marker.name}
      >
        <span className="block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      </div>
    </MaplibreMarker>
  )
})

export type SelectedItem =
  | z.infer<typeof schemas.MapItem>
  | ObjectiveMarkerType
  | z.infer<typeof schemas.flightGroup>
  | null

const FlightPlanOverlay = memo(function FlightPlanOverlay({
  flightplan,
  theatreName
}: {
  flightplan: z.infer<typeof schemas.flightplan>
  theatreName: string
}) {
  const { current: map } = useMap()
  const [path, setPath] = useState('')

  useEffect(() => {
    if (!map) return

    const updatePath = () => {
      const points = flightplan.waypoints.map((wp) => {
        const latLng = LOtoLL({
          theatre: theatreName as 'Caucasus',
          x: wp.position.x,
          z: wp.position.y
        })
        const p = map.project([latLng.lng, latLng.lat])
        return `${p.x},${p.y}`
      })
      setPath(`M ${points.join(' L ')}`)
    }

    updatePath()
    map.on('move', updatePath)
    map.on('zoom', updatePath)
    map.on('rotate', updatePath)
    map.on('resize', updatePath)

    return () => {
      map.off('move', updatePath)
      map.off('zoom', updatePath)
      map.off('rotate', updatePath)
      map.off('resize', updatePath)
    }
  }, [map, flightplan, theatreName])

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
      <path
        d={path}
        stroke="var(--synthwave-pink)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-[0_0_5px_var(--synthwave-pink)]"
      />
    </svg>
  )
})

const WaypointLabelMarker = memo(function WaypointLabelMarker({
  waypoint,
  theatreName
}: {
  waypoint: z.infer<typeof schemas.waypoint>
  theatreName: string
}) {
  const latLng = useMemo(
    () =>
      LOtoLL({
        theatre: theatreName as 'Caucasus',
        x: waypoint.position.x,
        z: waypoint.position.y
      }),
    [theatreName, waypoint.position.x, waypoint.position.y]
  )

  return (
    <MaplibreMarker
      longitude={latLng.lng}
      latitude={latLng.lat}
      anchor="top"
      style={{ zIndex: 30 }}
    >
      <div
        className="pointer-events-none relative z-30 rounded-full bg-synthwave-dark/80 px-2 py-0.5 text-xs text-synthwave-light ring-1 ring-synthwave-pink/40 shadow-[0_0_8px_rgba(255,0,170,0.35)]"
        style={{ transform: 'translateY(5px)' }}
      >
        {waypoint.name}
      </div>
    </MaplibreMarker>
  )
})

export function Map({
  selectedItem,
  onSelect
}: {
  selectedItem: SelectedItem
  onSelect: (item: SelectedItem) => void
}) {
  const scenarioId = useSelector(activeStore, (state) => state.context.scenarioId)

  const scenarioQuery = useQuery(
    orpc.data.getScenario.queryOptions({
      input: scenarioId
    })
  )
  const theatreQuery = useQuery(
    orpc.data.getTheatre.queryOptions({
      input: scenarioQuery.data?.theatreName ?? '',
      enabled: scenarioQuery.data?.theatreName != null
    })
  )
  const initialViewState = useMemo(() => {
    if (theatreQuery.data == null) return null
    const latLng = LOtoLL({
      theatre: theatreQuery.data.name as 'Caucasus',
      x: theatreQuery.data.info.center.x,
      z: theatreQuery.data.info.center.y
    })
    return {
      longitude: latLng.lng,
      latitude: latLng.lat,
      zoom: 7
    }
  }, [theatreQuery.data])
  const { mapItems, objectiveMarkers, frontline, flightGroups } = useMapItems()

  const liveSelectedItem = useMemo(() => {
    if (!selectedItem) return null
    if ('flightplan' in selectedItem) {
      return flightGroups.find((fg) => fg.id === selectedItem.id) ?? selectedItem
    }
    return mapItems.find((item) => item.id === selectedItem.id) ?? selectedItem
  }, [selectedItem, flightGroups, mapItems])

  // Generate GeoJSON for SAM range circles
  const samRangeGeoJson = useMemo(() => {
    const features: GeoJSON.Feature<GeoJSON.Polygon>[] = []

    for (const item of mapItems) {
      if (item.type !== 'SAM') continue

      // Create a circle with the SAM's range (range is in meters, turf expects km)
      const circle = turf.circle(
        [item.position.lng, item.position.lat],
        item.range / 1000, // Convert meters to km
        { steps: 64, units: 'kilometers' }
      )

      circle.properties = {
        id: item.id,
        coalition: item.coalition,
        name: item.name
      }

      features.push(circle)
    }

    return turf.featureCollection(features)
  }, [mapItems])

  // Only show the map if the view state is available
  if (initialViewState == null) return null
  return (
    <div className="w-full h-full relative">
      <MaplibreMap
        initialViewState={initialViewState}
        mapStyle="https://api.maptiler.com/maps/openstreetmap/style.json?key=dMqlZfgU5XToBXt4BGnm"
      >
        {liveSelectedItem && 'flightplan' in liveSelectedItem && theatreQuery.data && (
          <FlightPlanOverlay
            flightplan={liveSelectedItem.flightplan}
            theatreName={theatreQuery.data.name}
          />
        )}
        {liveSelectedItem && 'flightplan' in liveSelectedItem && theatreQuery.data && (
          <>
            {liveSelectedItem.flightplan.waypoints.map((waypoint, index) => (
              <WaypointLabelMarker
                key={`${waypoint.name}-${index}`}
                waypoint={waypoint}
                theatreName={theatreQuery.data.name}
              />
            ))}
          </>
        )}
        {/* SAM Range Circles - rendered first so they appear below other markers */}
        {samRangeGeoJson.features.length > 0 && (
          <Source id="sam-ranges-source" type="geojson" data={samRangeGeoJson}>
            {/* Player SAM range fill */}
            <Layer
              id="sam-range-fill-player"
              type="fill"
              filter={['==', ['get', 'coalition'], 'player']}
              paint={{
                'fill-color': '#00d4ff',
                'fill-opacity': 0.1
              }}
            />
            {/* Player SAM range outline */}
            <Layer
              id="sam-range-line-player"
              type="line"
              filter={['==', ['get', 'coalition'], 'player']}
              paint={{
                'line-color': '#00d4ff',
                'line-width': 2,
                'line-opacity': 0.6,
                'line-dasharray': [4, 2]
              }}
            />
            {/* Opponent SAM range fill */}
            <Layer
              id="sam-range-fill-opponent"
              type="fill"
              filter={['==', ['get', 'coalition'], 'opponent']}
              paint={{
                'fill-color': '#ff4444',
                'fill-opacity': 0.1
              }}
            />
            {/* Opponent SAM range outline */}
            <Layer
              id="sam-range-line-opponent"
              type="line"
              filter={['==', ['get', 'coalition'], 'opponent']}
              paint={{
                'line-color': '#ff4444',
                'line-width': 2,
                'line-opacity': 0.6,
                'line-dasharray': [4, 2]
              }}
            />
          </Source>
        )}
        {frontline && (
          <Source id="frontline-source" type="geojson" data={frontline}>
            <Layer
              id="frontline-layer"
              type="line"
              paint={{
                'line-color': 'blue',
                'line-width': 2,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}
        {mapItems.map((item) => (
          <Marker
            key={item.id}
            item={item}
            onClick={() => onSelect(item)}
            isSelected={liveSelectedItem?.id === item.id}
          />
        ))}
        {objectiveMarkers.map((marker) => (
          <ObjectiveCircleMarker
            key={marker.id}
            marker={marker}
            onClick={() => onSelect(marker)}
            isSelected={liveSelectedItem?.id === marker.id}
          />
        ))}
      </MaplibreMap>
      <DetailsCard selectedItem={liveSelectedItem} onClose={() => onSelect(null)} />
    </div>
  )
}
