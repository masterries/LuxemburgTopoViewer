<script setup lang="ts">
import type { CoordinateState } from '../composables/useCoordinates'
import { formatDecimal, formatDMS } from '../lib/format'
import { pushToast } from '../composables/useToast'

const props = defineProps<{ state: CoordinateState }>()

async function copy() {
  if (!props.state.lngLat) return
  try {
    await navigator.clipboard.writeText(formatDecimal(props.state.lngLat))
    pushToast('Coordinates copied to clipboard.', 'success', 2000)
  } catch {
    pushToast('Could not access the clipboard.', 'error')
  }
}
</script>

<template>
  <div v-if="state.lngLat" class="coord-bar panel">
    <button class="copy-btn" title="Copy decimal coordinates" aria-label="Copy coordinates" @click="copy">
      📋
    </button>
    <span class="coord-group">
      <span class="coord-label">WGS84</span>
      <span class="coord-val">{{ formatDMS(state.lngLat) }}</span>
    </span>
    <span v-if="state.luref" class="coord-group">
      <span class="coord-label">LUREF</span>
      <span class="coord-val">{{ state.luref[0].toFixed(0) }}, {{ state.luref[1].toFixed(0) }}</span>
    </span>
  </div>
</template>

<style scoped>
.coord-bar {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.copy-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  line-height: 1;
}
.coord-group {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.coord-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--accent);
}
.coord-val {
  color: var(--text);
}

/* Cursor coordinates are meaningless on touch devices. */
@media (hover: none), (max-width: 768px) {
  .coord-bar {
    display: none;
  }
}
</style>
