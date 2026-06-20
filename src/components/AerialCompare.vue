<script setup lang="ts">
import type { AerialCompareController } from '../composables/useAerialCompare'
import { ORTHO_YEARS } from '../lib/wmts'

const props = defineProps<{ controller: AerialCompareController }>()

function startDrag(event: PointerEvent) {
  event.preventDefault()
  const rect = document.getElementById('map')?.getBoundingClientRect()
  if (!rect) return
  const move = (e: PointerEvent) => props.controller.setSwipe((e.clientX - rect.left) / rect.width)
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}
</script>

<template>
  <div class="compare-root">
    <div class="compare-bar panel">
      <span class="cb-icon" aria-hidden="true">🕰️</span>
      <select
        class="field year"
        :value="controller.state.yearA"
        aria-label="Left (older) imagery year"
        @change="controller.setYearA(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="y in ORTHO_YEARS" :key="y.id" :value="y.id">{{ y.label }}</option>
      </select>
      <span class="cb-vs" aria-hidden="true">↔</span>
      <select
        class="field year"
        :value="controller.state.yearB"
        aria-label="Right (newer) imagery year"
        @change="controller.setYearB(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="y in ORTHO_YEARS" :key="y.id" :value="y.id">{{ y.label }}</option>
      </select>
      <button class="cb-close" aria-label="Exit comparison" title="Exit comparison" @click="controller.disable()">
        ✕
      </button>
    </div>

    <div class="compare-divider" :style="{ left: `${controller.state.swipe * 100}%` }">
      <button class="divider-handle" aria-label="Drag to compare" @pointerdown="startDrag">⇆</button>
    </div>
  </div>
</template>

<style scoped>
.compare-root {
  position: absolute;
  inset: 0;
  z-index: 1050;
  pointer-events: none;
}
.compare-bar {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  pointer-events: auto;
}
.cb-icon {
  font-size: 15px;
}
.year {
  width: auto;
  padding: 5px 8px;
  font-size: 13px;
}
.cb-vs {
  color: var(--text-muted);
}
.cb-close {
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 6px;
}
.cb-close:hover {
  background: var(--surface-2);
}

.compare-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  border-left: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}
.divider-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: var(--accent);
  color: #fff;
  font-size: 16px;
  cursor: ew-resize;
  pointer-events: auto;
  box-shadow: var(--shadow);
  touch-action: none;
}

@media (max-width: 768px) {
  .compare-bar {
    top: 52px;
  }
}
</style>
