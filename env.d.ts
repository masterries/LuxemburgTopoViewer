/// <reference types="vite/client" />

// The Geoportail.lu API v4 (`apiv4loader.js`) attaches OpenLayers and the
// `lux` convenience wrapper to the global scope. We don't have official
// type definitions for that build, so they are surfaced as `any` here and
// narrowed behind the typed facade in `src/lib/geoportail.ts`.
declare global {
  interface Window {
    ol: any
    lux: any
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

export {}
