import { reactive } from 'vue'
import { getOl, type LuxMap } from '../lib/geoportail'
import { mercatorToLngLat, mercatorToLuref, type Coord } from '../lib/projection'

export interface CoordinateState {
  /** Cursor position in WGS84 lon/lat. */
  lngLat: Coord | null
  /** Cursor position in LUREF (EPSG:2169). */
  luref: Coord | null
}

export interface CoordinateController {
  state: CoordinateState
  destroy(): void
}

/** Tracks the cursor position over the map in multiple projections. */
export function createCoordinateTracker(map: LuxMap): CoordinateController {
  const state = reactive<CoordinateState>({ lngLat: null, luref: null })
  const ol = getOl()

  const moveKey = map.on('pointermove', (evt: { dragging: boolean; coordinate: Coord }) => {
    if (evt.dragging) return
    state.lngLat = mercatorToLngLat(evt.coordinate)
    state.luref = mercatorToLuref(evt.coordinate)
  })

  const viewport = map.getViewport()
  const onLeave = () => {
    state.lngLat = null
    state.luref = null
  }
  viewport.addEventListener('pointerleave', onLeave)

  return {
    state,
    destroy() {
      ol.Observable.unByKey(moveKey)
      viewport.removeEventListener('pointerleave', onLeave)
    },
  }
}
