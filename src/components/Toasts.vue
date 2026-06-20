<script setup lang="ts">
import { computed } from 'vue'
import { useToasts } from '../composables/useToast'

const { toasts, dismissToast } = useToasts()

// Errors go in an assertive region so screen readers announce them promptly;
// info/success stay polite.
const errorToasts = computed(() => toasts.filter((t) => t.type === 'error'))
const politeToasts = computed(() => toasts.filter((t) => t.type !== 'error'))
</script>

<template>
  <div class="toast-stack">
    <div role="alert" aria-live="assertive">
      <TransitionGroup name="toast">
        <button v-for="t in errorToasts" :key="t.id" class="toast toast--error" @click="dismissToast(t.id)">
          {{ t.message }}
        </button>
      </TransitionGroup>
    </div>
    <div role="status" aria-live="polite">
      <TransitionGroup name="toast">
        <button
          v-for="t in politeToasts"
          :key="t.id"
          class="toast"
          :class="`toast--${t.type}`"
          @click="dismissToast(t.id)"
        >
          {{ t.message }}
        </button>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.toast-stack {
  position: absolute;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  pointer-events: none;
}
/* Let the two live regions disappear so toasts share one flex column. */
.toast-stack > div {
  display: contents;
}
.toast {
  pointer-events: auto;
  max-width: min(90vw, 420px);
  padding: 10px 16px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  color: #fff;
  background: #333;
  border: none;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
  cursor: pointer;
}
.toast--info {
  background: var(--accent);
  color: var(--accent-contrast);
}
.toast--success {
  background: var(--success);
}
.toast--error {
  background: var(--danger);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
