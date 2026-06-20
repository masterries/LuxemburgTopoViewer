<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import ControlPanel from '../components/ControlPanel.vue'
import SearchBox from '../components/SearchBox.vue'
import InfoPanel from '../components/InfoPanel.vue'
import MapToolbar from '../components/MapToolbar.vue'
import CoordinateBar from '../components/CoordinateBar.vue'
import PagLegend from '../components/PagLegend.vue'
import AerialCompare from '../components/AerialCompare.vue'
import { useMapInstance } from '../composables/useMapInstance'
import { createGeolocation, type GeolocationController } from '../composables/useGeolocation'
import { createMeasure, type MeasureController } from '../composables/useMeasure'
import { createCoordinateTracker, type CoordinateController } from '../composables/useCoordinates'
import { createParcelTools, ROODT_LNGLAT, type ParcelTools } from '../composables/useParcelTools'
import { createBackground, type BackgroundController } from '../composables/useBackground'
import { createPagOverlay, type PagController } from '../composables/usePagOverlay'
import { createAerialCompare, type AerialCompareController } from '../composables/useAerialCompare'
import { createMapPersistence, initialMapOptions } from '../composables/useMapPersistence'
import { fulltextSearch } from '../lib/api'
import { BACKGROUND_LAYERS, type BackgroundLayerId } from '../lib/geoportail'
import { lngLatToMercator } from '../lib/projection'
import { parseUrlState } from '../lib/urlState'
import { pushToast } from '../composables/useToast'
import type { InfoContent, SearchFeature } from '../lib/types'

const DEFAULT_BG: BackgroundLayerId = 'streets_jpeg'
const initial = initialMapOptions({ bg: DEFAULT_BG, zoom: 17, center: lngLatToMercator(ROODT_LNGLAT) })

const bg = ref<string>(initial.bgLayer in BACKGROUND_LAYERS ? initial.bgLayer : DEFAULT_BG)
const opacity = ref(0.5)
const showPag = ref(initial.overlays?.includes('pag') ?? false)
const info = ref<InfoContent | null>(null)

const geo = shallowRef<GeolocationController>()
const measure = shallowRef<MeasureController>()
const coords = shallowRef<CoordinateController>()
const pag = shallowRef<PagController>()
const compare = shallowRef<AerialCompareController>()

let tools: ParcelTools | null = null
let background: BackgroundController | null = null
let persistence: ReturnType<typeof createMapPersistence> | null = null

const { mapEl, ready, error } = useMapInstance(
  { bgLayer: 'streets_jpeg', zoom: initial.zoom, center: initial.center },
  (m, onCleanup) => {
    background = createBackground(m)
    void background.setBackground(bg.value)
    tools = createParcelTools(m, { onInfo: (c) => (info.value = c), initialOpacity: opacity.value })
    pag.value = createPagOverlay(m, showPag.value)
    compare.value = createAerialCompare(m)
    geo.value = createGeolocation(m)
    measure.value = createMeasure(m)
    coords.value = createCoordinateTracker(m)
    persistence = createMapPersistence(m, {
      app: 'parcels',
      getBg: () => bg.value,
      getOverlays: () => (showPag.value ? ['pag'] : []),
    })
    if (!parseUrlState().center) tools.goToRoodt()

    onCleanup(() => background?.destroy())
    onCleanup(() => tools?.destroy())
    onCleanup(() => pag.value?.destroy())
    onCleanup(() => compare.value?.destroy())
    onCleanup(() => geo.value?.destroy())
    onCleanup(() => measure.value?.destroy())
    onCleanup(() => coords.value?.destroy())
    onCleanup(() => persistence?.destroy())
  },
)

function onPag() {
  pag.value?.setVisible(showPag.value)
  persistence?.sync()
}

function searchParcels(query: string, signal: AbortSignal) {
  return fulltextSearch(query, { limit: 8, layers: ['Parcelle'], signal })
}

function onSelect(feature: SearchFeature) {
  tools?.highlightSearch(feature)
}

function onBgChange() {
  void background?.setBackground(bg.value)
  persistence?.sync()
}

function onOpacity() {
  tools?.setOpacity(opacity.value)
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

  <ControlPanel title="Parcel Search">
    <template #actions>
      <button class="share-btn" title="Copy shareable link" aria-label="Copy shareable link" @click="onShare">
        🔗
      </button>
    </template>

    <SearchBox placeholder="Search a parcel or place…" :search-fn="searchParcels" @select="onSelect" />

    <div class="control-group">
      <div class="control-row">
        <label for="bg">Background</label>
        <select id="bg" v-model="bg" class="field bg-select" @change="onBgChange">
          <option v-for="(label, id) in BACKGROUND_LAYERS" :key="id" :value="id">{{ label }}</option>
        </select>
      </div>
      <div class="control-row">
        <label for="opacity">Parcels opacity</label>
        <div class="slider-row">
          <input
            id="opacity"
            v-model.number="opacity"
            type="range"
            min="0"
            max="1"
            step="0.05"
            @input="onOpacity"
          />
          <span class="slider-val">{{ Math.round(opacity * 100) }}%</span>
        </div>
      </div>
      <label class="control-row toggle">
        <span>Zoning (PAG)</span>
        <input v-model="showPag" type="checkbox" @change="onPag" />
      </label>
    </div>

    <button class="btn btn--ghost btn--block" @click="compare?.toggle()">🕰️ Compare aerials</button>
    <button class="btn btn--block" @click="tools?.goToRoodt()">Go to Roodt (Redange)</button>
  </ControlPanel>

  <InfoPanel :content="info" @close="info = null" />
  <PagLegend v-if="pag && pag.state.visible" :src="pag.state.legendUrl" />
  <AerialCompare v-if="compare && compare.state.active" :controller="compare" />

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
.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.slider-row input[type='range'] {
  width: 130px;
  accent-color: var(--accent);
}
.slider-val {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  min-width: 34px;
  text-align: right;
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
