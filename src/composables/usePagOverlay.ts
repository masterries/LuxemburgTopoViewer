import { reactive } from 'vue'
import { getOl, OGC_WMS_URL, type LuxMap } from '../lib/geoportail'

/**
 * The "Plan d'Aménagement Général" (PAG) — the official land-use / zoning plan.
 * It is a dynamic WMS layer (not in the tile cache), served from the Geoportail
 * proxy. The colour-coded zones only make sense with the official legend, which
 * we fetch from the Geoportail legend service (the image URL is tokenised, so it
 * must be resolved at runtime rather than hard-coded).
 */
const LEGEND_HTML_URL = 'https://apiv4.geoportail.lu/legends/get_html?name=pag&lang=en'

let legendPromise: Promise<string | null> | null = null

function fetchLegendUrl(): Promise<string | null> {
  if (!legendPromise) {
    legendPromise = fetch(LEGEND_HTML_URL)
      .then((r) => r.text())
      .then(
        (html) => new DOMParser().parseFromString(html, 'text/html').querySelector('img')?.getAttribute('src') ?? null,
      )
      .catch(() => null)
  }
  return legendPromise
}

export interface PagState {
  visible: boolean
  /** Resolved legend image URL, or null until loaded/unavailable. */
  legendUrl: string | null
}

export interface PagController {
  state: PagState
  setVisible(visible: boolean): void
  destroy(): void
}

export function createPagOverlay(map: LuxMap, initialVisible = false): PagController {
  const ol = getOl()
  const state = reactive<PagState>({ visible: initialVisible, legendUrl: null })

  const layer = new ol.layer.Tile({
    source: new ol.source.TileWMS({
      url: OGC_WMS_URL,
      params: { LAYERS: 'pag_pag', FORMAT: 'image/png', TRANSPARENT: true },
      projection: 'EPSG:3857',
    }),
    opacity: 0.55,
    visible: initialVisible,
    zIndex: 30,
  })
  map.addLayer(layer)

  const ensureLegend = () => {
    if (!state.legendUrl) void fetchLegendUrl().then((url) => (state.legendUrl = url))
  }
  if (initialVisible) ensureLegend()

  return {
    state,
    setVisible(visible: boolean) {
      state.visible = visible
      layer.setVisible(visible)
      if (visible) ensureLegend()
    },
    destroy() {
      map.removeLayer(layer)
    },
  }
}
