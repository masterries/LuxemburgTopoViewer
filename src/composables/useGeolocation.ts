import { reactive } from 'vue'
import { getOl, type LuxMap } from '../lib/geoportail'
import { mercatorToLngLat, type Coord } from '../lib/projection'
import { pushToast } from './useToast'

export interface GeoState {
  /** GPS is currently acquiring/active. */
  tracking: boolean
  /** Continuous route-recording mode. */
  continuous: boolean
  /** Last known position in WGS84 lon/lat. */
  position: Coord | null
  /** Accuracy radius in metres. */
  accuracy: number | null
  /** Recorded route length in metres. */
  routeLength: number
  routeCount: number
}

export interface GeolocationController {
  state: GeoState
  locate(): void
  toggleContinuous(): void
  clearRoute(): void
  destroy(): void
}

/** Give up if neither a fix nor an error arrives within this window. */
const LOCATE_TIMEOUT_MS = 20000

const DOT_COLOR = '#1f6feb'

export function createGeolocation(map: LuxMap): GeolocationController {
  const ol = getOl()
  const state = reactive<GeoState>({
    tracking: false,
    continuous: false,
    position: null,
    accuracy: null,
    routeLength: 0,
    routeCount: 0,
  })

  const source = new ol.source.Vector()
  const dotStyle = new ol.style.Style({
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({ color: DOT_COLOR }),
      stroke: new ol.style.Stroke({ color: '#fff', width: 2 }),
    }),
  })
  const accuracyStyle = new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(31,111,235,0.15)' }),
    stroke: new ol.style.Stroke({ color: 'rgba(31,111,235,0.45)', width: 1 }),
  })
  const routeStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({ color: DOT_COLOR, width: 4 }),
  })

  const layer = new ol.layer.Vector({
    source,
    zIndex: 50,
    style: (feature: any) => {
      const role = feature.get('role')
      if (role === 'accuracy') return accuracyStyle
      if (role === 'route') return routeStyle
      return dotStyle
    },
  })
  map.addLayer(layer)

  const accuracyFeature = new ol.Feature()
  accuracyFeature.set('role', 'accuracy')
  const routeFeature = new ol.Feature()
  routeFeature.set('role', 'route')
  const positionFeature = new ol.Feature()
  positionFeature.set('role', 'position')
  source.addFeatures([accuracyFeature, routeFeature, positionFeature])

  /** Recorded route vertices in EPSG:3857. */
  const routeCoords: Coord[] = []

  const geolocation = new ol.Geolocation({
    trackingOptions: { enableHighAccuracy: true, maximumAge: 2000 },
    projection: map.getView().getProjection(),
  })

  let watchdog: ReturnType<typeof setTimeout> | undefined

  const listenerKeys = [] as any[]
  listenerKeys.push(geolocation.on('change:position', () => {
    const coord = geolocation.getPosition() as Coord | undefined
    if (!coord) return

    // A fix arrived: cancel the watchdog (continuous mode then keeps tracking).
    if (watchdog) {
      clearTimeout(watchdog)
      watchdog = undefined
    }

    positionFeature.setGeometry(new ol.geom.Point(coord))
    state.position = mercatorToLngLat(coord)
    state.accuracy = geolocation.getAccuracy() ?? null

    if (state.continuous) {
      routeCoords.push(coord)
      if (routeCoords.length > 1) {
        const line = new ol.geom.LineString(routeCoords)
        routeFeature.setGeometry(line)
        state.routeLength = ol.sphere.getLength(line, { projection: 'EPSG:3857' })
        state.routeCount = routeCoords.length
      }
      map.getView().animate({ center: coord, duration: 400 })
    } else {
      const currentZoom = map.getView().getZoom() ?? 14
      map.getView().animate({ center: coord, zoom: Math.max(currentZoom, 17), duration: 500 })
      stop() // one-shot: a single good fix is enough
    }
  }))

  listenerKeys.push(
    geolocation.on('change:accuracyGeometry', () => {
      accuracyFeature.setGeometry(geolocation.getAccuracyGeometry())
    }),
  )

  listenerKeys.push(
    geolocation.on('error', (err: { message?: string }) => {
      pushToast(`Location error: ${err.message ?? 'permission denied'}`, 'error')
      stop()
    }),
  )

  function start() {
    geolocation.setTracking(true)
    state.tracking = true
    if (watchdog) clearTimeout(watchdog)
    // Guard against the browser never firing a fix or an error (e.g. a
    // dismissed permission prompt), which would leave the button stuck "on".
    watchdog = setTimeout(() => {
      if (!state.position) pushToast('Could not get your location.', 'error')
      stop()
    }, LOCATE_TIMEOUT_MS)
  }

  function stop() {
    geolocation.setTracking(false)
    state.tracking = false
    accuracyFeature.setGeometry(undefined)
    if (watchdog) {
      clearTimeout(watchdog)
      watchdog = undefined
    }
  }

  return {
    state,
    locate() {
      state.continuous = false
      start()
    },
    toggleContinuous() {
      if (state.continuous) {
        state.continuous = false
        stop()
      } else {
        state.continuous = true
        start()
      }
    },
    clearRoute() {
      routeCoords.length = 0
      routeFeature.setGeometry(undefined)
      state.routeLength = 0
      state.routeCount = 0
    },
    destroy() {
      stop()
      ol.Observable.unByKey(listenerKeys)
      map.removeLayer(layer)
    },
  }
}
