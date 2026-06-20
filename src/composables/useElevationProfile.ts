import { reactive } from 'vue'
import { fetchElevationProfile } from '../lib/api'
import { computeProfileStats } from '../lib/format'
import { getOl, type LuxMap } from '../lib/geoportail'
import { lngLatToMercator, mercatorToLngLat, type Coord } from '../lib/projection'
import type { ProfilePoint, ProfileStats } from '../lib/types'
import { pushToast } from './useToast'

export interface ProfileState {
  /** A line is currently being drawn. */
  active: boolean
  loading: boolean
  points: ProfilePoint[]
  stats: ProfileStats | null
}

export interface ElevationProfileController {
  state: ProfileState
  /** Begin drawing a new profile line. */
  start(): void
  /** Remove the line, marker and chart data. */
  clear(): void
  /** Show (or hide, with null) a marker at a profile sample on the map. */
  setHover(point: ProfilePoint | null): void
  destroy(): void
}

export function createElevationProfile(map: LuxMap): ElevationProfileController {
  const ol = getOl()
  const state = reactive<ProfileState>({ active: false, loading: false, points: [], stats: null })

  const lineSource = new ol.source.Vector()
  const lineLayer = new ol.layer.Vector({
    source: lineSource,
    zIndex: 55,
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({ color: '#e5484d', width: 3 }),
      image: new ol.style.Circle({
        radius: 4,
        fill: new ol.style.Fill({ color: '#e5484d' }),
        stroke: new ol.style.Stroke({ color: '#fff', width: 1.5 }),
      }),
    }),
  })
  const hoverSource = new ol.source.Vector()
  const hoverLayer = new ol.layer.Vector({
    source: hoverSource,
    zIndex: 56,
    style: new ol.style.Style({
      image: new ol.style.Circle({
        radius: 8,
        fill: new ol.style.Fill({ color: '#1f6feb' }),
        stroke: new ol.style.Stroke({ color: '#fff', width: 3 }),
      }),
    }),
  })
  map.addLayer(lineLayer)
  map.addLayer(hoverLayer)

  let draw: any = null
  let abort: AbortController | null = null

  const removeDraw = () => {
    if (draw) {
      map.removeInteraction(draw)
      draw = null
    }
  }

  async function loadProfile(mercatorCoords: Coord[]) {
    const line = mercatorCoords.map(mercatorToLngLat)
    abort?.abort()
    abort = new AbortController()
    state.loading = true
    try {
      const points = await fetchElevationProfile(line, 150, abort.signal)
      state.points = points
      state.stats = computeProfileStats(points)
      if (points.length === 0) pushToast('No elevation data for this line.', 'info')
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        pushToast('Could not load the elevation profile.', 'error')
      }
    } finally {
      state.loading = false
    }
  }

  return {
    state,
    start() {
      this.clear()
      state.active = true
      draw = new ol.interaction.Draw({ source: lineSource, type: 'LineString' })
      draw.on('drawend', (event: any) => {
        const coords = event.feature.getGeometry().getCoordinates() as Coord[]
        removeDraw()
        state.active = false
        void loadProfile(coords)
      })
      map.addInteraction(draw)
    },
    clear() {
      removeDraw()
      abort?.abort()
      lineSource.clear()
      hoverSource.clear()
      state.active = false
      state.loading = false
      state.points = []
      state.stats = null
    },
    setHover(point: ProfilePoint | null) {
      hoverSource.clear()
      if (point) {
        hoverSource.addFeature(
          new ol.Feature({ geometry: new ol.geom.Point(lngLatToMercator(point.lngLat)) }),
        )
      }
    },
    destroy() {
      removeDraw()
      abort?.abort()
      map.removeLayer(lineLayer)
      map.removeLayer(hoverLayer)
    },
  }
}
