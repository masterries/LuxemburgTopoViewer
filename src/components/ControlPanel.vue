<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ title: string }>()
const collapsed = ref(false)
</script>

<template>
  <section class="control-panel panel" :class="{ collapsed }">
    <header class="cp-head">
      <h1 class="cp-title">{{ title }}</h1>
      <div class="cp-actions">
        <slot name="actions" />
        <button
          class="cp-toggle"
          :aria-expanded="!collapsed"
          :aria-label="collapsed ? 'Expand panel' : 'Collapse panel'"
          @click="collapsed = !collapsed"
        >
          {{ collapsed ? '☰' : '✕' }}
        </button>
      </div>
    </header>
    <div v-show="!collapsed" class="cp-body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.control-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  width: 320px;
  max-width: calc(100% - 20px);
  padding: 14px;
}
.cp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.cp-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}
.cp-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cp-toggle {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
}
.cp-toggle:hover {
  background: var(--surface-2);
}
.cp-body {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.control-panel.collapsed {
  width: auto;
}

@media (max-width: 768px) {
  .control-panel {
    top: 56px;
    width: calc(100% - 20px);
    max-height: 55vh;
    overflow-y: auto;
  }
}
</style>
