import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ltv-theme'

function initialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  localStorage.setItem(STORAGE_KEY, theme)
}

// Module-level singleton so every component shares one theme.
const theme = ref<Theme>(initialTheme())
apply(theme.value)

export function useTheme() {
  const toggle = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    apply(theme.value)
  }
  return { theme, toggle }
}
