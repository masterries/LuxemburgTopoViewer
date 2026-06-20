import { getOl } from './geoportail'

/**
 * Shared helpers for building raster `ol.source.WMTS` sources from the
 * Geoportail WMTS capabilities (used by both the background switcher and the
 * aerial time-comparison). The capabilities document is fetched once and cached.
 */
const CAPABILITIES_URL = 'https://wmts.geoportail.lu/mapproxy_4_v3/wmts/1.0.0/WMTSCapabilities.xml'
const PREFERRED_MATRIX_SET = 'GLOBAL_WEBMERCATOR_4_V3'

let capabilitiesPromise: Promise<unknown> | null = null

export function loadWmtsCapabilities(): Promise<unknown> {
  if (!capabilitiesPromise) {
    const ol = getOl()
    capabilitiesPromise = fetch(CAPABILITIES_URL)
      .then((r) => r.text())
      .then((text) => new ol.format.WMTSCapabilities().read(text))
  }
  return capabilitiesPromise
}

/** Build a WMTS source for a layer id, preferring the web-mercator matrix set. */
export async function createWmtsSource(layerId: string): Promise<any> {
  const ol = getOl()
  const caps = await loadWmtsCapabilities()
  const opts =
    ol.source.WMTS.optionsFromCapabilities(caps, { layer: layerId, matrixSet: PREFERRED_MATRIX_SET }) ??
    ol.source.WMTS.optionsFromCapabilities(caps, { layer: layerId })
  if (!opts) throw new Error(`WMTS layer "${layerId}" is not available in the capabilities.`)
  return new ol.source.WMTS(opts)
}

/**
 * Aerial orthophoto vintages available in the WMTS capabilities, newest first.
 * Used by the aerial time-comparison swipe.
 */
export const ORTHO_YEARS: Array<{ id: string; label: string }> = [
  { id: 'ortho', label: 'Latest' },
  { id: 'ortho_2025', label: '2025' },
  { id: 'ortho_2023', label: '2023' },
  { id: 'ortho_2022', label: '2022' },
  { id: 'ortho_2021', label: '2021' },
  { id: 'ortho_2020', label: '2020' },
  { id: 'ortho_2019', label: '2019' },
  { id: 'ortho_2018', label: '2018' },
  { id: 'ortho_2017', label: '2017' },
  { id: 'ortho_2016', label: '2016' },
  { id: 'ortho_2013', label: '2013' },
  { id: 'ortho_2010', label: '2010' },
  { id: 'ortho_2007', label: '2007' },
  { id: 'ortho_2004', label: '2004' },
  { id: 'ortho_2001', label: '2001' },
]
