import { getOl, type LuxMap } from '../lib/geoportail'
import { mercatorToLngLat, lngLatToMercator } from '../lib/projection'
import { debounce, parseUrlState, replaceUrl, shareUrl, type AppId, type UrlState } from '../lib/urlState'

export interface PersistenceOptions {
  app: AppId
  getBg: () => string
  getOverlays?: () => string[]
}

/** Resolve the initial map centre/zoom/bg from the URL, falling back to defaults. */
export function initialMapOptions(defaults: { bg: string; zoom: number; center: [number, number] }) {
  const url = parseUrlState()
  return {
    bgLayer: url.bg ?? defaults.bg,
    zoom: url.zoom ?? defaults.zoom,
    center: url.center ? lngLatToMercator(url.center) : defaults.center,
    overlays: url.overlays,
  }
}

/**
 * Keeps the URL in sync with the live map view so any state is shareable, and
 * exposes a `share()` builder for the "copy link" button.
 */
export function createMapPersistence(map: LuxMap, opts: PersistenceOptions) {
  function currentState(): UrlState {
    const view = map.getView()
    const zoom = view.getZoom()
    return {
      app: opts.app,
      center: mercatorToLngLat(view.getCenter()),
      zoom: zoom != null ? Math.round(zoom * 10) / 10 : undefined,
      bg: opts.getBg(),
      overlays: opts.getOverlays?.(),
    }
  }

  const sync = debounce(() => replaceUrl(currentState()), 400)
  const moveKey = map.on('moveend', sync)

  return {
    sync,
    share: () => shareUrl(currentState()),
    destroy: () => getOl().Observable.unByKey(moveKey),
  }
}
