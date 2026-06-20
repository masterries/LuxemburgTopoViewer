/**
 * Encodes the current view into the URL query string so any map state can be
 * bookmarked or shared. Kept deliberately compact and human-readable:
 *
 *   ?app=topo&c=6.131,49.611&z=14&bg=topo_bw&ov=contour,poi
 */
export type AppId = 'parcels' | 'topo'

export interface UrlState {
  app?: AppId
  /** [lng, lat] map centre. */
  center?: [number, number]
  zoom?: number
  bg?: string
  overlays?: string[]
}

export function parseUrlState(search = window.location.search): UrlState {
  const p = new URLSearchParams(search)
  const state: UrlState = {}

  const app = p.get('app')
  if (app === 'parcels' || app === 'topo') state.app = app

  const c = p.get('c')
  if (c) {
    const [lng, lat] = c.split(',').map(Number)
    if (Number.isFinite(lng) && Number.isFinite(lat)) state.center = [lng, lat]
  }

  const z = Number(p.get('z'))
  if (Number.isFinite(z) && z > 0) state.zoom = z

  const bg = p.get('bg')
  if (bg) state.bg = bg

  // `ov` present (even empty) means overlays were explicitly persisted; absent
  // means a fresh visit that should fall back to per-overlay defaults.
  const ov = p.get('ov')
  if (ov !== null) state.overlays = ov.split(',').filter(Boolean)

  return state
}

export function buildQuery(state: UrlState): string {
  const p = new URLSearchParams()
  if (state.app) p.set('app', state.app)
  if (state.center) p.set('c', `${state.center[0].toFixed(5)},${state.center[1].toFixed(5)}`)
  if (state.zoom != null) p.set('z', state.zoom.toFixed(1))
  if (state.bg) p.set('bg', state.bg)
  // Write `ov` whenever overlays are provided — including an empty list — so a
  // user turning a default-on overlay off round-trips through the URL.
  if (state.overlays) p.set('ov', state.overlays.join(','))
  return p.toString()
}

/** Replace the URL in place (no history entry) with the given state. */
export function replaceUrl(state: UrlState): void {
  const query = buildQuery(state)
  const url = `${window.location.pathname}${query ? '?' + query : ''}${window.location.hash}`
  window.history.replaceState(null, '', url)
}

/** Absolute shareable URL for the given state. */
export function shareUrl(state: UrlState): string {
  const query = buildQuery(state)
  return `${window.location.origin}${window.location.pathname}${query ? '?' + query : ''}`
}

/** Trailing-edge debounce. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}
