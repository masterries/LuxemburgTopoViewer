import { reactive } from 'vue'
import { getOl, type LuxMap } from '../lib/geoportail'
import { formatArea, formatDistance } from '../lib/format'

export type MeasureMode = 'none' | 'distance' | 'area'

export interface MeasureState {
  mode: MeasureMode
  /** Final measurement after a shape is finished. */
  result: string | null
  /** Live measurement while drawing. */
  live: string | null
}

export interface MeasureController {
  state: MeasureState
  setMode(mode: MeasureMode): void
  clear(): void
  destroy(): void
}

export function createMeasure(map: LuxMap): MeasureController {
  const ol = getOl()
  const state = reactive<MeasureState>({ mode: 'none', result: null, live: null })

  const source = new ol.source.Vector()
  const layer = new ol.layer.Vector({
    source,
    zIndex: 60,
    style: new ol.style.Style({
      fill: new ol.style.Fill({ color: 'rgba(229,72,77,0.12)' }),
      stroke: new ol.style.Stroke({ color: '#e5484d', width: 2, lineDash: [6, 6] }),
      image: new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({ color: '#e5484d' }),
        stroke: new ol.style.Stroke({ color: '#fff', width: 1.5 }),
      }),
    }),
  })
  map.addLayer(layer)

  let draw: any = null

  const measure = (geom: any): string | null => {
    if (geom instanceof ol.geom.Polygon) {
      return formatArea(ol.sphere.getArea(geom, { projection: 'EPSG:3857' }))
    }
    if (geom instanceof ol.geom.LineString) {
      return formatDistance(ol.sphere.getLength(geom, { projection: 'EPSG:3857' }))
    }
    return null
  }

  const removeDraw = () => {
    if (draw) {
      map.removeInteraction(draw)
      draw = null
    }
  }

  return {
    state,
    setMode(mode: MeasureMode) {
      removeDraw()
      state.mode = mode
      state.live = null
      state.result = null
      source.clear()
      if (mode === 'none') return

      draw = new ol.interaction.Draw({ source, type: mode === 'area' ? 'Polygon' : 'LineString' })
      draw.on('drawstart', (event: any) => {
        source.clear()
        state.result = null
        event.feature.getGeometry().on('change', (e: any) => {
          state.live = measure(e.target)
        })
      })
      draw.on('drawend', (event: any) => {
        state.result = measure(event.feature.getGeometry())
        state.live = null
      })
      map.addInteraction(draw)
    },
    clear() {
      source.clear()
      state.result = null
      state.live = null
    },
    destroy() {
      removeDraw()
      map.removeLayer(layer)
    },
  }
}
