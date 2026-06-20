/**
 * Thin, typed wrappers around the Geoportail.lu HTTP services.
 * No OpenLayers types leak in here — callers pass and receive plain lon/lat.
 */
import type { Coord } from './projection'
import { lngLatToLuref, lurefToLngLat } from './projection'
import type { GeoJSONFeature, ProfilePoint, SearchFeature, SearchResponse } from './types'

const SEARCH_URL = 'https://map.geoportail.lu/fulltextsearch'
const PROFILE_URL = 'https://map.geoportail.lu/profile.json'

function centreOf(feature: GeoJSONFeature): Coord {
  const bbox = feature.bbox
  if (bbox && bbox.length >= 4) {
    return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
  }
  // Fall back to the first coordinate we can find in the geometry.
  const coords = feature.geometry?.coordinates as unknown
  let node: unknown = coords
  while (Array.isArray(node) && Array.isArray(node[0])) node = node[0]
  if (Array.isArray(node) && typeof node[0] === 'number' && typeof node[1] === 'number') {
    return [node[0], node[1]]
  }
  return [6.13, 49.61]
}

export interface SearchOptions {
  limit?: number
  /** Keep only results whose `layer_name` is in this list (e.g. ['Parcelle']). */
  layers?: string[]
  signal?: AbortSignal
}

/** Full-text geographic search (place names, parcels, addresses, …). */
export async function fulltextSearch(
  query: string,
  { limit = 8, layers, signal }: SearchOptions = {},
): Promise<SearchFeature[]> {
  const url = `${SEARCH_URL}?query=${encodeURIComponent(query)}&limit=${limit}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Search failed (${res.status})`)
  const data = (await res.json().catch(() => null)) as SearchResponse | null
  const features = Array.isArray(data?.features) ? data.features : []

  return features
    .filter((f) => {
      if (!layers) return true
      const name = (f.properties?.layer_name as string) ?? ''
      return layers.includes(name)
    })
    .map((f) => ({
      id: String(f.id ?? ''),
      label: String(f.properties?.label ?? 'Unnamed'),
      layerName: String(f.properties?.layer_name ?? ''),
      lngLat: centreOf(f),
      bbox: f.bbox && f.bbox.length >= 4 ? (f.bbox.slice(0, 4) as [number, number, number, number]) : undefined,
      raw: f,
    }))
}

/**
 * Fetch an elevation profile for a poly-line.
 *
 * @param line   Vertices of the line in WGS84 lon/lat.
 * @param nbPoints  Number of samples to request along the line.
 */
export async function fetchElevationProfile(
  line: Coord[],
  nbPoints = 120,
  signal?: AbortSignal,
): Promise<ProfilePoint[]> {
  if (line.length < 2) return []

  // The profile service expects the geometry in LUREF (EPSG:2169).
  const geom = JSON.stringify({
    type: 'LineString',
    coordinates: line.map(lngLatToLuref),
  })

  const body = new URLSearchParams({ geom, nbPoints: String(nbPoints), layers: 'dhm' })
  const res = await fetch(PROFILE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal,
  })
  if (!res.ok) throw new Error(`Profile request failed (${res.status})`)

  const data = (await res.json()) as { profile?: Array<{ dist: number; values?: { dhm?: number }; x: number; y: number }> }
  const raw = data.profile ?? []

  return raw
    .filter((p) => p.values?.dhm != null)
    .map((p) => ({
      dist: p.dist,
      elevation: p.values!.dhm as number,
      lngLat: lurefToLngLat([p.x, p.y]),
    }))
}

