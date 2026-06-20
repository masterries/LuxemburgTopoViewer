<script setup lang="ts">
import { ref } from 'vue'
import ParcelView from './views/ParcelView.vue'
import TopoView from './views/TopoView.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import Toasts from './components/Toasts.vue'
import { parseUrlState, replaceUrl, type AppId } from './lib/urlState'

const activeApp = ref<AppId>(parseUrlState().app ?? 'parcels')

function switchApp(app: AppId) {
  if (app === activeApp.value) return
  activeApp.value = app
  // Keep the current centre/zoom in the URL; only swap the app id.
  replaceUrl({ ...parseUrlState(), app, bg: undefined, overlays: undefined })
}
</script>

<template>
  <header class="app-bar panel">
    <span class="brand">🗺️ <strong>Luxembourg</strong> Topo Viewer</span>
    <nav class="tabs" aria-label="Choose application">
      <button
        class="tab"
        :class="{ active: activeApp === 'parcels' }"
        :aria-pressed="activeApp === 'parcels'"
        @click="switchApp('parcels')"
      >
        Parcels
      </button>
      <button
        class="tab"
        :class="{ active: activeApp === 'topo' }"
        :aria-pressed="activeApp === 'topo'"
        @click="switchApp('topo')"
      >
        Topo
      </button>
    </nav>
    <ThemeToggle />
  </header>

  <main>
    <ParcelView v-if="activeApp === 'parcels'" />
    <TopoView v-else />
  </main>

  <Toasts />
</template>

<style scoped>
main {
  position: absolute;
  inset: 0;
}
.app-bar {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 12px;
  border-radius: var(--radius);
}
.brand {
  font-size: 15px;
  white-space: nowrap;
}
.brand strong {
  color: var(--accent);
}
.tabs {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
}
.tab {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-weight: 600;
  font-size: 13px;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.tab.active {
  background: var(--accent);
  color: var(--accent-contrast);
}

@media (max-width: 768px) {
  .app-bar {
    gap: 8px;
    padding: 6px 8px;
  }
  .brand strong {
    display: none;
  }
  .brand {
    font-size: 13px;
  }
}
</style>
