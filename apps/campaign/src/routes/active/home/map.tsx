import 'maplibre-gl/dist/maplibre-gl.css'

import { useSelector } from '@xstate/store/react'
import { activeStore } from '@/stores/active'
import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc'
import { memo, useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { LOtoLL } from '@kilcekru/dcs-coordinates'
import * as z from 'zod'
import { schemas } from '@dcc/contracts'
import MaplibreMap, {
  Marker as MaplibreMarker,
  Source,
  Layer,
  useMap,
  type MapLayerMouseEvent,
  type MapRef
} from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { RotateCcw } from 'lucide-react'
import MilSymbol from 'milsymbol'
import * as turf from '@turf/turf'
import { getMilSymbolCode } from './unit-code'
import { type ObjectiveMarker as ObjectiveMarkerType, useMapItems } from './use-map-items'
import { cn } from '@/lib/utils'
import { DetailsCard } from './details-card'
import { CAUCASUS_DETAIL_MAX_ZOOM, offlineCaucasusMapStyle } from './offline-map-style'

const globalWithPmtiles = globalThis as typeof globalThis & {
  __dccPmtilesProtocol?: Protocol
}
if (!globalWithPmtiles.__dccPmtilesProtocol) {
  globalWithPmtiles.__dccPmtilesProtocol = new Protocol()
  maplibregl.addProtocol('pmtiles', globalWithPmtiles.__dccPmtilesProtocol.tile)
}

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
  | z.infer<typeof schemas.groundGroup>
  | null

type MeasurePoint = {
  id: string
  lng: number
  lat: number
}

type MeasureState = {
  mode: boolean
  points: MeasurePoint[]
}

type MeasureSegment = {
  id: string
  from: MeasurePoint
  to: MeasurePoint
  distanceNm: number
}

const KILOMETERS_PER_NAUTICAL_MILE = 1.852

function getDistanceNm(from: MeasurePoint, to: MeasurePoint) {
  return (
    turf.distance([from.lng, from.lat], [to.lng, to.lat], {
      units: 'kilometers'
    }) / KILOMETERS_PER_NAUTICAL_MILE
  )
}

function formatNauticalMiles(value: number) {
  if (value < 10) return `${value.toFixed(1)} NM`
  return `${Math.round(value)} NM`
}

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

const GroundGroupPathOverlay = memo(function GroundGroupPathOverlay({
  groupPosition,
  targetPosition,
  theatreName
}: {
  groupPosition: { x: number; y: number }
  targetPosition: { x: number; y: number }
  theatreName: string
}) {
  const { current: map } = useMap()
  const [path, setPath] = useState('')

  useEffect(() => {
    if (!map) return

    const updatePath = () => {
      const from = LOtoLL({
        theatre: theatreName as 'Caucasus',
        x: groupPosition.x,
        z: groupPosition.y
      })
      const to = LOtoLL({
        theatre: theatreName as 'Caucasus',
        x: targetPosition.x,
        z: targetPosition.y
      })
      const p1 = map.project([from.lng, from.lat])
      const p2 = map.project([to.lng, to.lat])
      setPath(`M ${p1.x},${p1.y} L ${p2.x},${p2.y}`)
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
  }, [map, groupPosition, targetPosition, theatreName])

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
      <path
        d={path}
        stroke="var(--synthwave-pink)"
        strokeWidth="3"
        fill="none"
        strokeDasharray="6 4"
        strokeLinecap="round"
        className="drop-shadow-[0_0_5px_var(--synthwave-pink)]"
      />
    </svg>
  )
})

export function Map({
  selectedItem,
  previewItem,
  onSelect,
  zoom,
  measureMode,
  overlaySafeLeft = 0
}: {
  selectedItem: SelectedItem
  previewItem?: SelectedItem
  onSelect: (item: SelectedItem) => void
  zoom: number
  measureMode: boolean
  overlaySafeLeft?: number
}) {
  const scenarioId = useSelector(activeStore, (state) => state.context.scenarioId)
  const mapRef = useRef<MapRef | null>(null)
  const lastCenteredSelectionIdRef = useRef<string | null>(null)
  const [measureState, setMeasureState] = useState<MeasureState>({
    mode: measureMode,
    points: []
  })
  const measurePoints = useMemo(
    () => (measureState.mode === measureMode && measureMode ? measureState.points : []),
    [measureMode, measureState]
  )

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
      zoom
    }
  }, [theatreQuery.data, zoom])
  const { mapItems, objectiveMarkers, frontline, flightGroups } = useMapItems()

  const measureSegments = useMemo<MeasureSegment[]>(() => {
    const segments: MeasureSegment[] = []
    for (let i = 1; i < measurePoints.length; i++) {
      const from = measurePoints[i - 1]
      const to = measurePoints[i]
      if (!from || !to) continue
      segments.push({
        id: `${from.id}-${to.id}`,
        from,
        to,
        distanceNm: getDistanceNm(from, to)
      })
    }
    return segments
  }, [measurePoints])

  const measureTotalNm = useMemo(
    () => measureSegments.reduce((total, segment) => total + segment.distanceNm, 0),
    [measureSegments]
  )

  const measureLineGeoJson = useMemo<GeoJSON.FeatureCollection<GeoJSON.LineString>>(() => {
    if (measurePoints.length < 2) {
      return turf.featureCollection<GeoJSON.LineString>([])
    }

    return turf.featureCollection([
      turf.lineString(measurePoints.map((point) => [point.lng, point.lat]))
    ])
  }, [measurePoints])

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (!measureMode) return
      event.originalEvent.stopPropagation()
      const { lng, lat } = event.lngLat
      setMeasureState((state) => {
        const points = state.mode === measureMode ? state.points : []
        return {
          mode: measureMode,
          points: [
            ...points,
            {
              id: `${Date.now()}-${points.length}`,
              lng,
              lat
            }
          ]
        }
      })
    },
    [measureMode]
  )

  const handleResetMeasurement = useCallback(() => {
    setMeasureState({
      mode: measureMode,
      points: []
    })
  }, [measureMode])

  const liveSelectedItem = useMemo(() => {
    if (!selectedItem) return null
    if ('flightplan' in selectedItem) {
      return flightGroups.find((fg) => fg.id === selectedItem.id) ?? selectedItem
    }
    return mapItems.find((item) => item.id === selectedItem.id) ?? selectedItem
  }, [selectedItem, flightGroups, mapItems])

  const livePreviewItem = useMemo(() => {
    if (!previewItem) return null
    if ('flightplan' in previewItem) {
      return flightGroups.find((fg) => fg.id === previewItem.id) ?? previewItem
    }
    return mapItems.find((item) => item.id === previewItem.id) ?? previewItem
  }, [previewItem, flightGroups, mapItems])

  const flightPlanDisplayItem = useMemo(() => {
    if (livePreviewItem && 'flightplan' in livePreviewItem) {
      return livePreviewItem
    }
    if (liveSelectedItem && 'flightplan' in liveSelectedItem) {
      return liveSelectedItem
    }
    return null
  }, [livePreviewItem, liveSelectedItem])

  const campaign = useSelector(activeStore, (state) => state.context)
  const groundGroupPath = useMemo(() => {
    if (!liveSelectedItem || !theatreQuery.data) return null
    const id = liveSelectedItem.id
    const group =
      campaign.coalitions.player.groundGroups.find((g) => g.id === id) ??
      campaign.coalitions.opponent.groundGroups.find((g) => g.id === id)
    if (!group) return null
    if (group.targetObjectiveId) {
      const targetObjective = theatreQuery.data.objectives.find(
        (o) => o.name === group.targetObjectiveId
      )
      if (!targetObjective) return null
      return { groupPosition: group.position, targetPosition: targetObjective.position }
    }
    if (group.targetAirdromeName) {
      const targetAirdrome = theatreQuery.data.airdromeDetails[group.targetAirdromeName]
      if (!targetAirdrome) return null
      return {
        groupPosition: group.position,
        targetPosition: { x: targetAirdrome.x, y: targetAirdrome.y }
      }
    }
    return null
  }, [liveSelectedItem, campaign, theatreQuery.data])

  const selectedCoordinates = useMemo(() => {
    if (!liveSelectedItem || !theatreQuery.data) return null

    const position = liveSelectedItem.position
    if ('lat' in position && 'lng' in position) {
      return position
    }

    if ('x' in position && 'y' in position) {
      return LOtoLL({
        theatre: theatreQuery.data.name as 'Caucasus',
        x: position.x,
        z: position.y
      })
    }

    return null
  }, [liveSelectedItem, theatreQuery.data])

  useEffect(() => {
    const selectedId = liveSelectedItem?.id ?? null
    if (selectedId == null) {
      lastCenteredSelectionIdRef.current = null
      return
    }
    if (!selectedCoordinates || !mapRef.current) return
    if (lastCenteredSelectionIdRef.current === selectedId) return

    lastCenteredSelectionIdRef.current = selectedId
    mapRef.current.flyTo({
      center: [selectedCoordinates.lng, selectedCoordinates.lat],
      duration: 700,
      essential: true
    })
  }, [liveSelectedItem?.id, selectedCoordinates])

  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.flyTo({
      zoom,
      duration: 250,
      essential: true
    })
  }, [zoom])

  // Generate GeoJSON for SAM range circles
  const samRangeGeoJson = useMemo(() => {
    const features: GeoJSON.Feature<GeoJSON.Polygon>[] = []

    for (const item of mapItems) {
      if (item.type !== 'SAM') continue
      if (!item.active) continue

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
    <div
      className={cn('dcc-campaign-map w-full h-full relative', measureMode && 'cursor-crosshair')}
    >
      <MaplibreMap
        ref={mapRef}
        initialViewState={initialViewState}
        mapStyle={offlineCaucasusMapStyle}
        minZoom={3}
        maxZoom={CAUCASUS_DETAIL_MAX_ZOOM}
        onClick={handleMapClick}
      >
        {flightPlanDisplayItem && theatreQuery.data && (
          <FlightPlanOverlay
            flightplan={flightPlanDisplayItem.flightplan}
            theatreName={theatreQuery.data.name}
          />
        )}
        {groundGroupPath && theatreQuery.data && (
          <GroundGroupPathOverlay
            groupPosition={groundGroupPath.groupPosition}
            targetPosition={groundGroupPath.targetPosition}
            theatreName={theatreQuery.data.name}
          />
        )}
        {flightPlanDisplayItem && theatreQuery.data && (
          <>
            {flightPlanDisplayItem.flightplan.waypoints.map((waypoint, index) => (
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
        {measurePoints.length > 1 && (
          <Source id="measure-line-source" type="geojson" data={measureLineGeoJson}>
            <Layer
              id="measure-line-glow"
              type="line"
              paint={{
                'line-color': '#0b0014',
                'line-width': 7,
                'line-opacity': 0.75
              }}
            />
            <Layer
              id="measure-line"
              type="line"
              paint={{
                'line-color': '#00ddff',
                'line-width': 3,
                'line-dasharray': [1.5, 1.2]
              }}
            />
          </Source>
        )}
        {measureMode &&
          measurePoints.map((point, index) => (
            <MaplibreMarker
              key={point.id}
              longitude={point.lng}
              latitude={point.lat}
              anchor="center"
              style={{ zIndex: 35 }}
            >
              <div className="pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-synthwave-dark/90 ring-2 ring-synthwave-cyan shadow-[0_0_12px_rgba(0,221,255,0.55)]">
                <span className="h-1.5 w-1.5 rounded-full bg-synthwave-cyan" />
                {index === 0 ? null : (
                  <span className="absolute translate-x-4 -translate-y-3 rounded bg-synthwave-dark/90 px-1.5 py-0.5 text-[10px] font-semibold text-synthwave-light ring-1 ring-synthwave-cyan/35">
                    {index + 1}
                  </span>
                )}
              </div>
            </MaplibreMarker>
          ))}
        {measureMode &&
          measureSegments.map((segment) => (
            <MaplibreMarker
              key={segment.id}
              longitude={(segment.from.lng + segment.to.lng) / 2}
              latitude={(segment.from.lat + segment.to.lat) / 2}
              anchor="center"
              style={{ zIndex: 34 }}
            >
              <div className="pointer-events-none rounded bg-synthwave-dark/90 px-2 py-0.5 text-[11px] font-semibold text-synthwave-cyan shadow-[0_0_10px_rgba(0,0,0,0.5)] ring-1 ring-synthwave-cyan/35">
                {formatNauticalMiles(segment.distanceNm)}
              </div>
            </MaplibreMarker>
          ))}
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
      <DetailsCard
        selectedItem={liveSelectedItem}
        onClose={() => onSelect(null)}
        onSelectObjective={(name) => {
          const marker = objectiveMarkers.find((m) => m.name === name)
          if (marker) onSelect(marker)
        }}
      />
      {measureMode && (
        <div
          className="pointer-events-auto absolute top-4 z-20 flex -translate-x-1/2 items-center gap-3 rounded border border-synthwave-cyan/40 bg-synthwave-dark/90 px-3 py-2 text-synthwave-light shadow-[0_0_18px_rgba(0,221,255,0.22)] backdrop-blur-md"
          style={{
            left: `max(50%, calc((100% + ${overlaySafeLeft}px) / 2))`,
            maxWidth: `calc(100% - ${overlaySafeLeft}px - 2rem)`
          }}
        >
          <div className="flex items-baseline gap-2">
            <span className="retro-font text-[10px] uppercase text-synthwave-cyan">Measure</span>
            <span className="text-sm font-semibold tabular-nums">
              {formatNauticalMiles(measureTotalNm)}
            </span>
          </div>
          <button
            type="button"
            className="flex h-6 items-center gap-1.5 rounded border border-synthwave-pink/30 px-2 text-[10px] font-semibold uppercase text-secondary hover:bg-synthwave-pink/20 hover:text-white"
            onClick={handleResetMeasurement}
            title="Reset measurement"
            aria-label="Reset measurement"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      )}
    </div>
  )
}
