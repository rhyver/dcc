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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Marker = memo(function Marker({
  item,
  onClick,
  isSelected
}: {
  item: z.infer<typeof schemas.MapItem>
  onClick: () => void
  isSelected: boolean
}) {
  const isSam = item.type === 'SAM'
  const color = item.coalition === 'player' ? '#00d4ff' : '#ff4444'

  const symbol = useMemo(() => {
    if (isSam) return null
    const symbol = new MilSymbol.Symbol(getMilSymbolCode(item), {
      size: 20
    })
    return symbol.asSVG()
  }, [item, isSam])

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
      {isSam ? (
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-sm border-2 bg-black/80 transition-all',
            isSelected && 'ring-2 ring-white scale-125'
          )}
          style={{ borderColor: color }}
          title={item.name}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill={color}>
            <path d="M12 2L8 8H4L12 22L20 8H16L12 2Z" />
          </svg>
        </div>
      ) : (
        <div
          className={cn(
            'transition-all',
            isSelected && 'ring-2 ring-white rounded-full drop-shadow-md scale-110'
          )}
          dangerouslySetInnerHTML={{ __html: symbol! }}
        />
      )}
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
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1000 }}
    >
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
  const { mapItems, objectiveMarkers, frontline } = useMapItems()

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
        {selectedItem && 'flightplan' in selectedItem && theatreQuery.data && (
          <FlightPlanOverlay
            flightplan={selectedItem.flightplan}
            theatreName={theatreQuery.data.name}
          />
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
            isSelected={selectedItem?.id === item.id}
          />
        ))}
        {objectiveMarkers.map((marker) => (
          <ObjectiveCircleMarker
            key={marker.id}
            marker={marker}
            onClick={() => onSelect(marker)}
            isSelected={selectedItem?.id === marker.id}
          />
        ))}
      </MaplibreMap>
      {selectedItem && (
        <div className="absolute top-4 right-4 w-80 z-10">
          <Card className="backdrop-blur-md bg-synthwave-dark/80 border-synthwave-pink/30 text-synthwave-light shadow-[0_0_15px_rgba(255,0,170,0.3)]">
            <CardHeader>
              <CardTitle className="text-synthwave-cyan retro-font">
                {'callsign' in selectedItem ? selectedItem.callsign : selectedItem.name}
              </CardTitle>
              <CardDescription className="capitalize text-secondary">
                {'coalition' in selectedItem ? selectedItem.coalition : 'player'}{' '}
                {'type' in selectedItem
                  ? selectedItem.type
                  : 'callsign' in selectedItem
                    ? 'Flight Group'
                    : 'Objective'}
              </CardDescription>
              <CardAction>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelect(null)}
                  className="text-synthwave-pink hover:bg-synthwave-pink/20 hover:text-synthwave-pink"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {'lat' in selectedItem.position ? (
                  <>
                    <div className="text-secondary/70">Latitude</div>
                    <div>{selectedItem.position.lat.toFixed(4)}</div>
                    <div className="text-secondary/70">Longitude</div>
                    <div>{selectedItem.position.lng.toFixed(4)}</div>
                  </>
                ) : (
                  <>
                    <div className="text-secondary/70">Position X</div>
                    <div>{selectedItem.position.x.toFixed(0)}</div>
                    <div className="text-secondary/70">Position Y</div>
                    <div>{selectedItem.position.y.toFixed(0)}</div>
                  </>
                )}
                {'structureType' in selectedItem && (
                  <>
                    <div className="text-secondary/70">Structure Type</div>
                    <div>{selectedItem.structureType}</div>
                  </>
                )}
                {'flightplan' in selectedItem && (
                  <>
                    <div className="text-secondary/70">Task</div>
                    <div>{selectedItem.task}</div>
                    <div className="text-secondary/70">Waypoints</div>
                    <div>{selectedItem.flightplan.waypoints.length}</div>
                  </>
                )}
                {'range' in selectedItem && (
                  <>
                    <div className="text-secondary/70">Range</div>
                    <div>{(selectedItem.range / 1000).toFixed(1)} km</div>
                    <div className="text-secondary/70">Status</div>
                    <div className={selectedItem.active ? 'text-green-400' : 'text-red-400'}>
                      {selectedItem.active ? 'Active' : 'Inactive'}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
