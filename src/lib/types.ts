import type { Coord } from './projection'

/** A single search hit from the Geoportail fulltext search API. */
export interface SearchFeature {
  id: string
  label: string
  layerName: string
  /** Centre of the result in WGS84 lon/lat. */
  lngLat: Coord
  /** [minLng, minLat, maxLng, maxLat] when available. */
  bbox?: [number, number, number, number]
  /** Raw GeoJSON feature, kept for highlighting on the map. */
  raw: GeoJSONFeature
}

/** A normalised elevation-profile sample. */
export interface ProfilePoint {
  /** Cumulative distance from the start, in metres. */
  dist: number
  /** Elevation in metres (from the `dhm` digital height model). */
  elevation: number
  /** Sample location in WGS84 lon/lat (for syncing a map marker on hover). */
  lngLat: Coord
}

/** Aggregate statistics derived from a profile. */
export interface ProfileStats {
  distance: number
  minElevation: number
  maxElevation: number
  avgElevation: number
  ascent: number
  descent: number
  startElevation: number
  endElevation: number
}

/** One labelled row in the information panel. */
export interface InfoRow {
  label: string
  value: string
}

/** Content shown in the bottom-left information panel. */
export interface InfoContent {
  title: string
  rows: InfoRow[]
}

export interface GeoJSONFeature {
  type: 'Feature'
  id?: string | number
  bbox?: number[]
  geometry: { type: string; coordinates: unknown } | null
  properties: Record<string, unknown> | null
}

export interface SearchResponse {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}
