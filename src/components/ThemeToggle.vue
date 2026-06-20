<script setup lang="ts">
import { useTheme } from '../composables/useTheme'

const { theme, toggle } = useTheme()
</script>

<template>
  <button
    class="theme-toggle"
    :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggle"
  >
    <span aria-hidden="true">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 16px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--surface-2);
  cursor: pointer;
  line-height: 1;
}
.theme-toggle:hover {
  background: var(--border);
}
</style>
