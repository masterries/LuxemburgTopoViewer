import { getOl, type LuxMap } from '../lib/geoportail'
import { createWmtsSource } from '../lib/wmts'
import { pushToast } from './useToast'

/**
 * Owns the map's base layer.
 *
 * The Geoportail `lux.Map#setBackground` helper currently routes most layers
 * through a MapLibre vector pipeline whose style is broken server-side, so
 * instead we build proper raster `ol.source.WMTS` sources from the published
 * WMTS capabilities and render them ourselves. This is reliable and unlocks
 * the full raster catalog (latest ortho, topo map…).
 *
 * lux manages its own base layer asynchronously — it may replace it AND move it
 * above our layer in the stack. So rather than fight over lux's layer, we add
 * our own fully-controlled raster base at the bottom and keep lux's base hidden
 * wherever it ends up (its layers are the only ones carrying a `name`).
 */
export interface BackgroundController {
  setBackground(id: string): Promise<void>
  destroy(): void
}

export function createBackground(map: LuxMap): BackgroundController {
  const ol = getOl()

  // Hide lux's own base layer (invisible layers don't fetch tiles) and insert
  // our own raster base layer just above it, below every overlay added later.
  const layers = map.getLayers()
  // Our base layer goes at the very bottom; overlays added later sit above it.
  const baseLayer = new ol.layer.Tile({})
  layers.insertAt(0, baseLayer)

  // lux's base layer(s) are the only ones with a `name`; hide them wherever
  // lux puts them (it can re-create the layer above ours). Hidden layers also
  // stop fetching tiles. Run on every collection change to catch re-creation.
  const hideLuxBase = () => {
    for (const layer of layers.getArray()) {
      if (layer !== baseLayer && layer.get('name')) layer.setVisible(false)
    }
  }
  const layersKey = layers.on(['add', 'remove'], hideLuxBase)
  hideLuxBase()

  const sourceCache = new Map<string, any>()
  let desiredId: string | null = null

  async function sourceFor(id: string) {
    const cached = sourceCache.get(id)
    if (cached) return cached
    const source = await createWmtsSource(id)
    sourceCache.set(id, source)
    return source
  }

  return {
    async setBackground(id: string) {
      desiredId = id
      try {
        const source = await sourceFor(id)
        if (desiredId !== id) return // a newer request superseded this one
        baseLayer.setSource(source)
      } catch {
        pushToast(`Could not load the "${id}" background.`, 'error')
      }
    },
    destroy() {
      ol.Observable.unByKey(layersKey)
      layers.remove(baseLayer)
    },
  }
}
