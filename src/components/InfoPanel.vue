<script setup lang="ts">
import type { InfoContent } from '../lib/types'

defineProps<{ content: InfoContent | null }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <aside v-if="content" class="info-panel panel">
    <header class="info-head">
      <h2 class="info-title">{{ content.title }}</h2>
      <button class="info-close" aria-label="Close" @click="$emit('close')">✕</button>
    </header>
    <dl class="info-grid">
      <template v-for="(row, i) in content.rows" :key="i">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </template>
    </dl>
  </aside>
</template>

<style scoped>
.info-panel {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 1000;
  width: 320px;
  max-width: calc(100% - 24px);
  padding: 12px 14px;
}
.info-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.info-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}
.info-close {
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 6px;
}
.info-close:hover {
  background: var(--surface-2);
}
.info-grid {
  display: grid;
  grid-template-columns: minmax(90px, auto) 1fr;
  gap: 4px 10px;
  margin: 0;
  font-size: 13px;
}
.info-grid dt {
  font-weight: 600;
  color: var(--text-muted);
}
.info-grid dd {
  margin: 0;
  word-break: break-word;
}

@media (max-width: 768px) {
  .info-panel {
    bottom: 8px;
  }
}
</style>
