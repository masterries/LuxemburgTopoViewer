<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { GeolocationController } from '../composables/useGeolocation'
import type { MeasureController, MeasureMode } from '../composables/useMeasure'
import { formatDistance } from '../lib/format'

const props = defineProps<{
  geo: GeolocationController
  measure: MeasureController
}>()

const isFullscreen = ref(false)

function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen()
  } else {
    void document.documentElement.requestFullscreen?.()
  }
}

function onFsChange() {
  isFullscreen.value = !!document.fullscreenElement
}

function toggleMeasure(mode: Exclude<MeasureMode, 'none'>) {
  props.measure.setMode(props.measure.state.mode === mode ? 'none' : mode)
}

onMounted(() => document.addEventListener('fullscreenchange', onFsChange))
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onFsChange))
</script>

<template>
  <div class="toolbar">
    <button
      class="tool-btn"
      :class="{ on: geo.state.tracking && !geo.state.continuous }"
      title="Locate me"
      aria-label="Locate me"
      @click="geo.locate()"
    >
      📍
    </button>
    <button
      class="tool-btn"
      :class="{ on: geo.state.continuous }"
      :aria-pressed="geo.state.continuous"
      title="Record route (continuous tracking)"
      aria-label="Record route"
      @click="geo.toggleContinuous()"
    >
      🛰️
    </button>
    <button
      v-if="geo.state.routeCount > 1"
      class="tool-btn danger"
      title="Clear recorded route"
      aria-label="Clear recorded route"
      @click="geo.clearRoute()"
    >
      🗑️
    </button>

    <span class="tool-sep" />

    <button
      class="tool-btn"
      :class="{ on: measure.state.mode === 'distance' }"
      :aria-pressed="measure.state.mode === 'distance'"
      title="Measure distance"
      aria-label="Measure distance"
      @click="toggleMeasure('distance')"
    >
      📏
    </button>
    <button
      class="tool-btn"
      :class="{ on: measure.state.mode === 'area' }"
      :aria-pressed="measure.state.mode === 'area'"
      title="Measure area"
      aria-label="Measure area"
      @click="toggleMeasure('area')"
    >
      📐
    </button>

    <span class="tool-sep" />

    <button
      class="tool-btn"
      :class="{ on: isFullscreen }"
      :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
      :aria-label="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
      @click="toggleFullscreen"
    >
      {{ isFullscreen ? '🡼' : '⛶' }}
    </button>
  </div>

  <div v-if="geo.state.continuous && geo.state.routeCount > 1" class="readout panel">
    Route: {{ geo.state.routeCount }} pts · {{ formatDistance(geo.state.routeLength) }}
  </div>

  <div v-if="measure.state.mode !== 'none'" class="readout panel measure-readout">
    <strong>{{ measure.state.result ?? measure.state.live ?? '—' }}</strong>
    <span class="muted">
      {{ measure.state.result ? 'click 📏/📐 again to clear' : `click to add points, double-click to finish` }}
    </span>
  </div>
</template>

<style scoped>
.toolbar {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tool-btn {
  width: 44px;
  height: 44px;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--surface);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform 0.05s ease, background 0.15s ease;
}
.tool-btn:hover {
  background: var(--surface-2);
}
.tool-btn:active {
  transform: scale(0.94);
}
.tool-btn.on {
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent), var(--shadow);
}
.tool-btn.danger:hover {
  background: var(--danger);
}
.tool-sep {
  height: 1px;
  margin: 1px 8px;
  background: var(--border);
}
.readout {
  position: absolute;
  right: 68px;
  bottom: 12px;
  z-index: 1000;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 220px;
}
.measure-readout {
  bottom: 64px;
}
.measure-readout span {
  font-size: 11px;
}

@media (max-width: 768px) {
  .readout {
    right: 64px;
  }
}
</style>
