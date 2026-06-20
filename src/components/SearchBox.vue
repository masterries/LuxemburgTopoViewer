<script setup lang="ts">
import { ref } from 'vue'
import type { SearchFeature } from '../lib/types'

const props = defineProps<{
  placeholder?: string
  searchFn: (query: string, signal: AbortSignal) => Promise<SearchFeature[]>
}>()

const emit = defineEmits<{ select: [feature: SearchFeature] }>()

const query = ref('')
const results = ref<SearchFeature[]>([])
const loading = ref(false)
const message = ref<string | null>(null)
let controller: AbortController | null = null

async function run() {
  const q = query.value.trim()
  if (!q) return
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  message.value = null
  results.value = []
  try {
    const found = await props.searchFn(q, controller.signal)
    results.value = found
    if (!found.length) message.value = 'No results found.'
  } catch (e) {
    if ((e as Error).name !== 'AbortError') message.value = 'Search failed. Please try again.'
  } finally {
    loading.value = false
  }
}

function pick(feature: SearchFeature) {
  emit('select', feature)
}

const listRef = ref<HTMLUListElement>()

function items(): HTMLElement[] {
  return Array.from(listRef.value?.querySelectorAll<HTMLElement>('.result-item') ?? [])
}

function focusFirstResult() {
  items()[0]?.focus()
}

function onResultKey(event: KeyboardEvent, index: number) {
  const els = items()
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    els[Math.min(index + 1, els.length - 1)]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (index === 0) inputRef.value?.focus()
    else els[index - 1]?.focus()
  }
}

const inputRef = ref<HTMLInputElement>()
</script>

<template>
  <div class="search">
    <div class="search-row">
      <input
        ref="inputRef"
        v-model="query"
        class="field search-input"
        type="search"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="results.length > 0"
        :placeholder="placeholder ?? 'Search…'"
        :aria-label="placeholder ?? 'Search'"
        @keydown.enter.prevent="run"
        @keydown.down.prevent="focusFirstResult"
      />
      <button class="btn" :disabled="loading" :aria-busy="loading" aria-label="Search" @click="run">
        <span v-if="!loading">Search</span>
        <template v-else>
          <span class="spinner" aria-hidden="true" />
          <span class="visually-hidden">Searching…</span>
        </template>
      </button>
    </div>

    <div aria-live="polite">
      <ul v-if="results.length" ref="listRef" class="results" role="listbox" :aria-label="placeholder ?? 'Search results'">
        <li v-for="(r, i) in results" :key="r.id || r.label" role="presentation">
          <button class="result-item" role="option" @click="pick(r)" @keydown="onResultKey($event, i)">
            <span class="result-label">{{ r.label }}</span>
            <span class="result-layer muted">{{ r.layerName }}</span>
          </button>
        </li>
      </ul>
      <p v-else-if="message" class="muted search-message">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.search-row {
  display: flex;
  gap: 6px;
}
.search-input {
  flex: 1;
  min-width: 0;
}
.results {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.result-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border: none;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font: inherit;
  cursor: pointer;
}
.results li:last-child .result-item {
  border-bottom: none;
}
.result-item:hover {
  background: var(--surface-2);
}
.result-label {
  font-size: 13px;
  font-weight: 600;
}
.result-layer {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.search-message {
  margin: 8px 0 0;
  font-size: 13px;
}
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
