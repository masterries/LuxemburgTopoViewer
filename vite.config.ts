import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Relative base so the build works both at the domain root and under a
// GitHub Pages project sub-path (e.g. /LuxemburgTopoViewer/) without
// hard-coding the repository name.
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
})
