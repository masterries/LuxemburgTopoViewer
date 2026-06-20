import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { getLux, loadGeoportail, type LuxMap } from '../lib/geoportail'

export interface MapInitOptions {
  bgLayer: string
  zoom: number
  /** Map centre in EPSG:3857. */
  center: [number, number]
}

/** Registers a teardown callback to run when the view unmounts. */
export type RegisterCleanup = (fn: () => void) => void

/**
 * Creates a Geoportail `lux.Map` bound to a template element once the API has
 * loaded, and tears it down on unmount. `onReady` runs after the map exists —
 * that is where a view adds its overlay layers and tool controllers — and is
 * handed a `registerCleanup` so each controller's teardown runs before the map
 * is disposed (important because the views are swapped with `v-if`).
 */
export function useMapInstance(
  options: MapInitOptions,
  onReady?: (map: LuxMap, registerCleanup: RegisterCleanup) => void | Promise<void>,
) {
  const mapEl = ref<HTMLElement>()
  const map = shallowRef<LuxMap | null>(null)
  const ready = ref(false)
  const error = ref<string | null>(null)
  const cleanups: Array<() => void> = []
  const registerCleanup: RegisterCleanup = (fn) => cleanups.push(fn)

  onMounted(async () => {
    try {
      await loadGeoportail()
      const lux = getLux()
      const instance = new lux.Map({
        target: mapEl.value,
        bgLayer: options.bgLayer,
        zoom: options.zoom,
      })
      // lux's `position` constructor option reinterprets coordinates as LUREF
      // (EPSG:2169). The view itself is EPSG:3857, so set the centre and zoom
      // explicitly afterwards to place the map where we actually mean.
      instance.getView().setCenter(options.center)
      instance.getView().setZoom(options.zoom)
      map.value = instance
      ready.value = true
      await onReady?.(instance, registerCleanup)
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    }
  })

  onBeforeUnmount(() => {
    for (const fn of cleanups.splice(0)) {
      try {
        fn()
      } catch {
        /* ignore teardown errors */
      }
    }
    if (map.value) {
      map.value.setTarget(undefined)
      // dispose() releases OpenLayers' own listeners, render loop and layers.
      map.value.dispose?.()
      map.value = null
    }
  })

  return { mapEl, map, ready, error }
}
