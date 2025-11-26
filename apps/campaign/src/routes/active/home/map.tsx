import 'maplibre-gl/dist/maplibre-gl.css'

import { useSelector } from '@xstate/store/react'
import { activeStore } from '@/stores/active'
import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc'
import { memo, useMemo, useState } from 'react'
import { LOtoLL } from '@kilcekru/dcs-coordinates'
import * as z from 'zod'
import { schemas } from '@dcc/contracts'
import MaplibreMap, { Marker as MaplibreMarker, Source, Layer } from 'react-map-gl/maplibre'
import MilSymbol from 'milsymbol'
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
      color={item.coalition === 'player' ? 'blue' : 'red'}
      onClick={(e) => {
        e.originalEvent.stopPropagation()
        onClick()
      }}
    >
      <div
        className={cn(
          'transition-all',
          isSelected && 'ring-2 ring-white rounded-full drop-shadow-md scale-110'
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
  const color = marker.coalition === 'player' ? '#00ddff' : '#ff4d4f'
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

export function Map() {
  const scenarioId = useSelector(activeStore, (state) => state.context.scenarioId)
  const [selectedItem, setSelectedItem] = useState<
    z.infer<typeof schemas.MapItem> | ObjectiveMarkerType | null
  >(null)

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

  // Only show the map if the view state is available
  if (initialViewState == null) return null
  return (
    <div className="w-full h-full relative">
      <MaplibreMap
        initialViewState={initialViewState}
        mapStyle="https://api.maptiler.com/maps/openstreetmap/style.json?key=dMqlZfgU5XToBXt4BGnm"
      >
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
            onClick={() => setSelectedItem(item)}
            isSelected={selectedItem?.id === item.id}
          />
        ))}
        {objectiveMarkers.map((marker) => (
          <ObjectiveCircleMarker
            key={marker.id}
            marker={marker}
            onClick={() => setSelectedItem(marker)}
            isSelected={selectedItem?.id === marker.id}
          />
        ))}
      </MaplibreMap>
      {selectedItem && (
        <div className="absolute top-4 right-4 w-80 z-10">
          <Card className="backdrop-blur-md bg-[#0b0014]/80 border-[#ff00aa]/30 text-[#e0e0ff] shadow-[0_0_15px_rgba(255,0,170,0.3)]">
            <CardHeader>
              <CardTitle className="text-[#00ddff] retro-font">{selectedItem.name}</CardTitle>
              <CardDescription className="capitalize text-secondary">
                {selectedItem.coalition} {'type' in selectedItem ? selectedItem.type : 'Objective'}
              </CardDescription>
              <CardAction>
                <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)} className="text-[#ff00aa] hover:bg-[#ff00aa]/20 hover:text-[#ff00aa]">
                  <X className="h-4 w-4" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-secondary/70">Latitude</div>
                <div>{selectedItem.position.lat.toFixed(4)}</div>
                <div className="text-secondary/70">Longitude</div>
                <div>{selectedItem.position.lng.toFixed(4)}</div>
                {'structureType' in selectedItem && (
                  <>
                    <div className="text-secondary/70">Structure Type</div>
                    <div>{selectedItem.structureType}</div>
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
