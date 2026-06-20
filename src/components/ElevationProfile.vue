<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Chart, registerables, type ChartConfiguration } from 'chart.js'
import type { ElevationProfileController } from '../composables/useElevationProfile'
import { useTheme } from '../composables/useTheme'
import { formatDistance } from '../lib/format'

Chart.register(...registerables)

const props = defineProps<{ controller: ElevationProfileController }>()
const { theme } = useTheme()

const state = props.controller.state
const canvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

const visible = computed(() => state.points.length > 0 || state.active || state.loading)

const stats = computed(() => state.stats)
function metres(value: number | undefined): string {
  return value == null ? '—' : `${Math.round(value)} m`
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function buildConfig(): ChartConfiguration<'line'> {
  return {
    type: 'line',
    data: { datasets: [{ data: [], parsing: false, borderColor: '#1f6feb', borderWidth: 2, pointRadius: 0, fill: true, tension: 0.25 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      onHover: (_evt, elements) => {
        const point = elements.length ? state.points[elements[0].index] : null
        props.controller.setHover(point ?? null)
      },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Distance (km)' }, ticks: { maxTicksLimit: 8 } },
        y: { title: { display: true, text: 'Elevation (m)' } },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `${Number(items[0].parsed.x).toFixed(2)} km`,
            label: (item) => `${Math.round(Number(item.parsed.y))} m`,
          },
        },
      },
    },
  }
}

function applyTheme() {
  if (!chart) return
  const text = cssVar('--text-muted') || '#666'
  const grid = cssVar('--border') || '#ddd'
  const accent = cssVar('--accent') || '#1f6feb'
  const scales = chart.options.scales as Record<string, any>
  for (const axis of ['x', 'y']) {
    scales[axis].ticks = { ...scales[axis].ticks, color: text }
    scales[axis].grid = { color: grid }
    scales[axis].title = { ...scales[axis].title, color: text }
  }
  const ds = chart.data.datasets[0] as any
  ds.borderColor = accent
  ds.backgroundColor = `${accent}22`
}

function updateChart() {
  if (!chart) return
  chart.data.datasets[0].data = state.points.map((p) => ({ x: p.dist / 1000, y: p.elevation }))
  applyTheme()
  chart.update()
}

watch(canvas, (el) => {
  if (el && !chart) {
    chart = new Chart(el, buildConfig())
    updateChart()
  } else if (!el && chart) {
    chart.destroy()
    chart = null
  }
})

watch(() => state.points, updateChart, { deep: false })
watch(theme, () => {
  applyTheme()
  chart?.update()
})

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
  props.controller.setHover(null)
})
</script>

<template>
  <section v-if="visible" class="profile panel">
    <header class="profile-head">
      <div class="profile-stats" v-if="stats">
        <span class="stat"><b>{{ formatDistance(stats.distance) }}</b><i>distance</i></span>
        <span class="stat up"><b>↑ {{ metres(stats.ascent) }}</b><i>ascent</i></span>
        <span class="stat down"><b>↓ {{ metres(stats.descent) }}</b><i>descent</i></span>
        <span class="stat"><b>{{ metres(stats.minElevation) }}</b><i>min</i></span>
        <span class="stat"><b>{{ metres(stats.maxElevation) }}</b><i>max</i></span>
        <span class="stat"><b>{{ metres(stats.avgElevation) }}</b><i>avg</i></span>
      </div>
      <div v-else class="profile-hint muted">
        {{ state.loading ? 'Loading elevation data…' : 'Click points on the map, double-click to finish.' }}
      </div>
      <div class="profile-actions">
        <button class="btn btn--ghost" @click="controller.start()">Draw new</button>
        <button class="btn btn--ghost" @click="controller.clear()">Clear</button>
      </div>
    </header>
    <div class="chart-wrap" @mouseleave="controller.setHover(null)">
      <canvas ref="canvas" />
    </div>
  </section>
</template>

<style scoped>
.profile {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 1001;
  padding: 10px 14px 6px;
  border-radius: var(--radius);
}
.profile-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.profile-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.stat {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.stat b {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
.stat i {
  font-style: normal;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.stat.up b {
  color: var(--success);
}
.stat.down b {
  color: var(--danger);
}
.profile-hint {
  font-size: 13px;
}
.profile-actions {
  display: flex;
  gap: 6px;
}
.chart-wrap {
  height: 140px;
  margin-top: 6px;
}

@media (max-width: 768px) {
  .profile {
    left: 8px;
    right: 8px;
    bottom: 8px;
  }
  .chart-wrap {
    height: 110px;
  }
  .stat b {
    font-size: 12px;
  }
}
</style>
