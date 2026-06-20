import type { Coord } from './projection'
import type { ProfilePoint, ProfileStats } from './types'

/** Convert one decimal degree to a degrees/minutes/seconds string. */
export function toDMS(value: number, axis: 'lat' | 'lng'): string {
  const abs = Math.abs(value)
  const degrees = Math.floor(abs)
  const minutesFull = (abs - degrees) * 60
  const minutes = Math.floor(minutesFull)
  const seconds = ((minutesFull - minutes) * 60).toFixed(1)
  const hemisphere = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W'
  return `${degrees}°${minutes}′${seconds}″${hemisphere}`
}

/** "49°36′…N 6°08′…E" for a lon/lat pair. */
export function formatDMS([lng, lat]: Coord): string {
  return `${toDMS(lat, 'lat')} ${toDMS(lng, 'lng')}`
}

/** "49.612345, 6.083210" for a lon/lat pair. */
export function formatDecimal([lng, lat]: Coord): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

/** Human-friendly length: metres below 1 km, kilometres above. */
export function formatDistance(metres: number): string {
  return metres < 1000 ? `${metres.toFixed(0)} m` : `${(metres / 1000).toFixed(2)} km`
}

/** Human-friendly area: m², hectares, or km². */
export function formatArea(squareMetres: number): string {
  if (squareMetres < 10_000) return `${squareMetres.toFixed(0)} m²`
  if (squareMetres < 1_000_000) return `${(squareMetres / 10_000).toFixed(2)} ha`
  return `${(squareMetres / 1_000_000).toFixed(2)} km²`
}

/**
 * Cadastral area: square metres plus the Luxembourg cadastral unit (are,
 * 1 a = 100 m²), e.g. "2376 m² · 23.76 a". Large parcels fall back to km².
 */
export function formatParcelArea(squareMetres: number): string {
  const m2 = `${Math.round(squareMetres)} m²`
  if (squareMetres >= 1_000_000) return `${m2} · ${(squareMetres / 1_000_000).toFixed(2)} km²`
  return `${m2} · ${(squareMetres / 100).toFixed(2)} a`
}

/**
 * Derive ascent/descent/min/max/avg statistics from a profile.
 *
 * Small fluctuations are noise in a digital height model, so cumulative
 * ascent/descent only count rises and falls above a threshold.
 */
export function computeProfileStats(points: ProfilePoint[], threshold = 1): ProfileStats | null {
  if (points.length < 2) return null

  let min = Infinity
  let max = -Infinity
  let sum = 0
  let ascent = 0
  let descent = 0
  let reference = points[0].elevation

  for (const { elevation } of points) {
    min = Math.min(min, elevation)
    max = Math.max(max, elevation)
    sum += elevation

    const delta = elevation - reference
    if (Math.abs(delta) >= threshold) {
      if (delta > 0) ascent += delta
      else descent += -delta
      reference = elevation
    }
  }

  return {
    distance: points[points.length - 1].dist,
    minElevation: min,
    maxElevation: max,
    avgElevation: sum / points.length,
    ascent,
    descent,
    startElevation: points[0].elevation,
    endElevation: points[points.length - 1].elevation,
  }
}
