import { reactive } from 'vue'
import { getOl, type LuxMap } from '../lib/geoportail'
import { createWmtsSource } from '../lib/wmts'
import { pushToast } from './useToast'

/**
 * Aerial time-comparison: two orthophoto vintages stacked above everything, with
 * the upper (right-hand) layer clipped at a draggable vertical divider. Dragging
 * the divider reveals the older imagery on the left and the newer on the right,
 * making land-use changes over the years easy to see.
 */
export interface AerialCompareState {
  active: boolean
  /** Left-hand orthophoto layer id. */
  yearA: string
  /** Right-hand orthophoto layer id. */
  yearB: string
  /** Divider position as a fraction of the map width (0–1). */
  swipe: number
}

export interface AerialCompareController {
  state: AerialCompareState
  toggle(): void
  enable(): void
  disable(): void
  setYearA(id: string): void
  setYearB(id: string): void
  setSwipe(ratio: number): void
  destroy(): void
}

const Z_LEFT = 35
const Z_RIGHT = 36

export function createAerialCompare(
  map: LuxMap,
  initial: { yearA?: string; yearB?: string } = {},
): AerialCompareController {
  const ol = getOl()
  const state = reactive<AerialCompareState>({
    active: false,
    yearA: initial.yearA ?? 'ortho_2001',
    yearB: initial.yearB ?? 'ortho',
    swipe: 0.5,
  })

  const layerLeft = new ol.layer.Tile({ zIndex: Z_LEFT, visible: false })
  const layerRight = new ol.layer.Tile({ zIndex: Z_RIGHT, visible: false })

  // Clip the right-hand layer to everything right of the divider.
  layerRight.on('prerender', (event: any) => {
    const ctx = event.context as CanvasRenderingContext2D
    const { width, height } = ctx.canvas
    const x = width * state.swipe
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, 0, width - x, height)
    ctx.clip()
  })
  layerRight.on('postrender', (event: any) => {
    ;(event.context as CanvasRenderingContext2D).restore()
  })

  map.addLayer(layerLeft)
  map.addLayer(layerRight)

  const sourceCache = new Map<string, any>()
  async function applySource(layer: any, id: string) {
    try {
      let source = sourceCache.get(id)
      if (!source) {
        source = await createWmtsSource(id)
        sourceCache.set(id, source)
      }
      layer.setSource(source)
    } catch {
      pushToast(`Could not load the ${id} aerial imagery.`, 'error')
    }
  }

  function enable() {
    state.active = true
    layerLeft.setVisible(true)
    layerRight.setVisible(true)
    void applySource(layerLeft, state.yearA)
    void applySource(layerRight, state.yearB)
  }

  function disable() {
    state.active = false
    layerLeft.setVisible(false)
    layerRight.setVisible(false)
  }

  return {
    state,
    toggle() {
      if (state.active) disable()
      else enable()
    },
    enable,
    disable,
    setYearA(id: string) {
      state.yearA = id
      if (state.active) void applySource(layerLeft, id)
    },
    setYearB(id: string) {
      state.yearB = id
      if (state.active) void applySource(layerRight, id)
    },
    setSwipe(ratio: number) {
      state.swipe = Math.min(1, Math.max(0, ratio))
      map.render()
    },
    destroy() {
      map.removeLayer(layerLeft)
      map.removeLayer(layerRight)
    },
  }
}
