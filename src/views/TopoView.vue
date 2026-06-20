<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import ControlPanel from '../components/ControlPanel.vue'
import SearchBox from '../components/SearchBox.vue'
import InfoPanel from '../components/InfoPanel.vue'
import MapToolbar from '../components/MapToolbar.vue'
import CoordinateBar from '../components/CoordinateBar.vue'
import ElevationProfile from '../components/ElevationProfile.vue'
import PagLegend from '../components/PagLegend.vue'
import AerialCompare from '../components/AerialCompare.vue'
import { useMapInstance } from '../composables/useMapInstance'
import { createGeolocation, type GeolocationController } from '../composables/useGeolocation'
import { createMeasure, type MeasureController } from '../composables/useMeasure'
import { createCoordinateTracker, type CoordinateController } from '../composables/useCoordinates'
import { createElevationProfile, type ElevationProfileController } from '../composables/useElevationProfile'
import { createBackground, type BackgroundController } from '../composables/useBackground'
import { createPagOverlay, type PagController } from '../composables/usePagOverlay'
import { createAerialCompare, type AerialCompareController } from '../composables/useAerialCompare'
import { createMapPersistence, initialMapOptions } from '../composables/useMapPersistence'
import { fulltextSearch } from '../lib/api'
import {
  BACKGROUND_LAYERS,
  getOl,
  LUXEMBOURG_CENTER_3857,
  WMS_URL,
  type BackgroundLayerId,
  type LuxMap,
} from '../lib/geoportail'
import { lngLatToMercator } from '../lib/projection'
import { pushToast } from '../composables/useToast'
import type { InfoContent, SearchFeature } from '../lib/types'

const DEFAULT_BG: BackgroundLayerId = 'topomap'
const initial = initialMapOptions({ bg: DEFAULT_BG, zoom: 12, center: LUXEMBOURG_CENTER_3857 })

const bg = ref<string>(initial.bgLayer in BACKGROUND_LAYERS ? initial.bgLayer : DEFAULT_BG)
const showContour = ref(initial.overlays ? initial.overlays.includes('contour') : true)
const showPoi = ref(initial.overlays ? initial.overlays.includes('poi') : false)
const showPag = ref(initial.overlays?.includes('pag') ?? false)
const info = ref<InfoContent | null>(null)

const geo = shallowRef<GeolocationController>()
const measure = shallowRef<MeasureController>()
const coords = shallowRef<CoordinateController>()
const profile = shallowRef<ElevationProfileController>()
const pag = shallowRef<PagController>()
const compare = shallowRef<AerialCompareController>()

let contourLayer: any = null
let poiLayer: any = null
let background: BackgroundController | null = null
let persistence: ReturnType<typeof createMapPersistence> | null = null

function wmsOverlay(ol: any, layers: string, opacity: number, visible: boolean) {
  return new ol.layer.Tile({
    source: new ol.source.TileWMS({
      url: WMS_URL,
      params: { LAYERS: layers, FORMAT: 'image/png', TRANSPARENT: true },
      projection: 'EPSG:3857',
    }),
    opacity,
    visible,
  })
}

const { mapEl, map, ready, error } = useMapInstance(
  { bgLayer: 'streets_jpeg', zoom: initial.zoom, center: initial.center },
  (m: LuxMap, onCleanup) => {
    const ol = getOl()
    background = createBackground(m)
    void background.setBackground(bg.value)
    contourLayer = wmsOverlay(ol, 'contourlines', 0.7, showContour.value)
    poiLayer = wmsOverlay(ol, 'poi,amenity_points', 0.9, showPoi.value)
    m.addLayer(contourLayer)
    m.addLayer(poiLayer)

    pag.value = createPagOverlay(m, showPag.value)
    compare.value = createAerialCompare(m)
    geo.value = createGeolocation(m)
    measure.value = createMeasure(m)
    coords.value = createCoordinateTracker(m)
    profile.value = createElevationProfile(m)
    persistence = createMapPersistence(m, {
      app: 'topo',
      getBg: () => bg.value,
      getOverlays: () =>
        [showContour.value ? 'contour' : '', showPoi.value ? 'poi' : '', showPag.value ? 'pag' : ''].filter(Boolean),
    })

    onCleanup(() => background?.destroy())
    onCleanup(() => pag.value?.destroy())
    onCleanup(() => compare.value?.destroy())
    onCleanup(() => geo.value?.destroy())
    onCleanup(() => measure.value?.destroy())
    onCleanup(() => coords.value?.destroy())
    onCleanup(() => profile.value?.destroy())
    onCleanup(() => persistence?.destroy())
    onCleanup(() => {
      m.removeLayer(contourLayer)
      m.removeLayer(poiLayer)
    })
  },
)

function onBgChange() {
  void background?.setBackground(bg.value)
  persistence?.sync()
}

function onContour() {
  contourLayer?.setVisible(showContour.value)
  persistence?.sync()
}

function onPoi() {
  poiLayer?.setVisible(showPoi.value)
  persistence?.sync()
}

function onPag() {
  pag.value?.setVisible(showPag.value)
  persistence?.sync()
}

function startProfile() {
  measure.value?.setMode('none')
  profile.value?.start()
}

function onSelect(feature: SearchFeature) {
  const view = map.value?.getView()
  if (!view) return
  if (feature.bbox) {
    const min = lngLatToMercator([feature.bbox[0], feature.bbox[1]])
    const max = lngLatToMercator([feature.bbox[2], feature.bbox[3]])
    view.fit([min[0], min[1], max[0], max[1]], { padding: [80, 80, 80, 80], maxZoom: 17, duration: 600 })
  } else {
    view.animate({ center: lngLatToMercator(feature.lngLat), zoom: 16, duration: 600 })
  }
  info.value = {
    title: 'Location',
    rows: [
      { label: 'Name', value: feature.label },
      { label: 'Layer', value: feature.layerName },
    ],
  }
}

function searchPlaces(query: string, signal: AbortSignal) {
  return fulltextSearch(query, { limit: 6, signal })
}

async function onShare() {
  if (!persistence) return
  try {
    await navigator.clipboard.writeText(persistence.share())
    pushToast('Shareable link copied to clipboard.', 'success')
  } catch {
    pushToast('Could not copy the link.', 'error')
  }
}
</script>

<template>
  <div id="map" ref="mapEl" />

  <p v-if="error" class="map-error panel">{{ error }}</p>

  <ControlPanel title="Topographic Map">
    <template #actions>
      <button class="share-btn" title="Copy shareable link" aria-label="Copy shareable link" @click="onShare">
        🔗
      </button>
    </template>

    <SearchBox placeholder="Search a place in Luxembourg…" :search-fn="searchPlaces" @select="onSelect" />

    <div class="control-group">
      <div class="control-row">
        <label for="bg">Background</label>
        <select id="bg" v-model="bg" class="field bg-select" @change="onBgChange">
          <option v-for="(label, id) in BACKGROUND_LAYERS" :key="id" :value="id">{{ label }}</option>
        </select>
      </div>
      <label class="control-row toggle">
        <span>Contour lines</span>
        <input v-model="showContour" type="checkbox" @change="onContour" />
      </label>
      <label class="control-row toggle">
        <span>Points of interest</span>
        <input v-model="showPoi" type="checkbox" @change="onPoi" />
      </label>
      <label class="control-row toggle">
        <span>Zoning (PAG)</span>
        <input v-model="showPag" type="checkbox" @change="onPag" />
      </label>
    </div>

    <button class="btn btn--block" @click="startProfile">📈 Draw elevation profile</button>
    <button class="btn btn--ghost btn--block" @click="compare?.toggle()">🕰️ Compare aerials</button>
  </ControlPanel>

  <InfoPanel :content="info" @close="info = null" />
  <PagLegend v-if="pag && pag.state.visible" :src="pag.state.legendUrl" />
  <AerialCompare v-if="compare && compare.state.active" :controller="compare" />

  <ElevationProfile v-if="profile" :controller="profile" />

  <template v-if="ready && geo && measure">
    <MapToolbar :geo="geo" :measure="measure" />
  </template>
  <CoordinateBar v-if="coords" :state="coords.state" />
</template>

<style scoped>
.control-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}
.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.toggle {
  cursor: pointer;
}
.toggle input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
}
.bg-select {
  width: auto;
}
.share-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 15px;
  padding: 2px 4px;
  border-radius: 6px;
}
.share-btn:hover {
  background: var(--surface-2);
}
.map-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1500;
  max-width: 320px;
  padding: 16px;
  text-align: center;
  color: var(--danger);
}
</style>
