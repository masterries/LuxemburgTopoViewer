<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ src: string | null }>()
const collapsed = ref(false)
</script>

<template>
  <aside v-if="src" class="pag-legend panel" :class="{ collapsed }">
    <header class="pl-head">
      <h2 class="pl-title">Zoning legend (PAG)</h2>
      <button
        class="pl-toggle"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? 'Expand legend' : 'Collapse legend'"
        @click="collapsed = !collapsed"
      >
        {{ collapsed ? '▸' : '▾' }}
      </button>
    </header>
    <div v-show="!collapsed" class="pl-body">
      <img :src="src" alt="PAG zoning legend" />
    </div>
  </aside>
</template>

<style scoped>
.pag-legend {
  position: absolute;
  top: 60px;
  left: 10px;
  z-index: 1000;
  width: 230px;
  max-width: calc(100% - 20px);
  padding: 8px 10px;
}
.pl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.pl-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}
.pl-toggle {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  padding: 0 4px;
  border-radius: 6px;
}
.pl-toggle:hover {
  background: var(--surface-2);
}
.pl-body {
  margin-top: 8px;
  max-height: 45vh;
  overflow-y: auto;
}
.pl-body img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  background: #fff;
}

@media (max-width: 768px) {
  .pag-legend {
    top: 52px;
    width: 180px;
  }
  .pl-body {
    max-height: 35vh;
  }
}
</style>
