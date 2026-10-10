import * as maplibregl from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

// Bundle the worker and its shared imports for Vite and the packaged renderer protocol.
maplibregl.setWorkerUrl(workerUrl)

export { maplibregl }
