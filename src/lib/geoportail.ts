/**
 * Loader and typed access for the global Geoportail.lu API v4.
 *
 * `apiv4loader.js` (included via a <script> tag in index.html) asynchronously
 * attaches OpenLayers (`window.ol`) and the `lux` convenience wrapper
 * (`window.lux`) to the global scope. Everything in the app goes through this
 * module so there is a single place that waits for the API and a single place
 * that the loosely-typed globals are accessed.
 */

// OpenLayers and lux are an untyped global build; alias as `any` but keep the
// names meaningful at call sites.
export type OL = any
export type Lux = any
export type LuxMap = any

let loadPromise: Promise<void> | null = null

/** Resolve once `window.ol` and `window.lux` are available. */
export function loadGeoportail(timeoutMs = 20000): Promise<void> {
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    const started = performance.now()

    const poll = () => {
      if (window.ol && window.lux) {
        resolve()
        return
      }
      if (performance.now() - started > timeoutMs) {
        reject(
          new Error(
            'The Geoportail.lu API (apiv4loader.js) did not load. Check your network connection.',
          ),
        )
        return
      }
      window.setTimeout(poll, 50)
    }

    poll()
  })

  return loadPromise
}

export function getOl(): OL {
  if (!window.ol) throw new Error('OpenLayers is not loaded yet. Call loadGeoportail() first.')
  return window.ol
}

export function getLux(): Lux {
  if (!window.lux) throw new Error('lux is not loaded yet. Call loadGeoportail() first.')
  return window.lux
}

/**
 * Background base layers, keyed by their WMTS layer identifier (from
 * https://wmts.geoportail.lu/mapproxy_4_v3/wmts/1.0.0/WMTSCapabilities.xml).
 * These are served as raster tiles and built directly with `ol.source.WMTS`
 * (see `useBackground`), rather than through lux's vector basemap pipeline.
 * The legacy names (`topo_bw`, `ortho_latest`, `topoigncn_jpeg`) no longer
 * exist; `ortho` (latest aerial) and `topomap` (topographic) replace them.
 */
export const BACKGROUND_LAYERS = {
  streets_jpeg: 'Streets',
  topomap: 'Topographic',
  ortho: 'Aerial',
  basemap_2015_global: 'Basemap',
} as const

export type BackgroundLayerId = keyof typeof BACKGROUND_LAYERS

/** Geoportail WMS endpoint used for cached overlay tile layers (parcels, contours…). */
export const WMS_URL = 'https://wms.geoportail.lu/mapproxy_4_v3/service?'

/** Geoportail dynamic WMS proxy, used for thematic layers such as the PAG zoning. */
export const OGC_WMS_URL = 'https://map.geoportail.lu/ogcproxywms?'

/** Approximate geographic centre of Luxembourg, in EPSG:3857. */
export const LUXEMBOURG_CENTER_3857: [number, number] = [684000, 6379000]
