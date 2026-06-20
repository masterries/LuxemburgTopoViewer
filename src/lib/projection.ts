/**
 * Coordinate transformations between the three projections this app touches:
 *
 *  - EPSG:4326  WGS84 lon/lat (search results, GPS, display)
 *  - EPSG:3857  Web Mercator (the OpenLayers map view)
 *  - EPSG:2169  LUREF / Luxembourg TM (required by the elevation profile API)
 *
 * proj4 ships EPSG:4326 by default; the other two are registered here so all
 * conversions are self-contained and independent of whatever projections the
 * global OpenLayers build happens to register.
 */
import proj4 from 'proj4'

export type Coord = [number, number]

// Official EPSG:2169 definition (epsg.io/2169). LUREF is on the International
// 1924 (Hayford) ellipsoid with a 7-parameter Helmert shift to WGS84 — using
// GRS80 with a null shift (a common mistake) places every conversion ~46 m off,
// which corrupts both the LUREF readout and the elevation-profile sampling.
proj4.defs(
  'EPSG:2169',
  '+proj=tmerc +lat_0=49.8333333333333 +lon_0=6.16666666666667 +k=1 ' +
    '+x_0=80000 +y_0=100000 +ellps=intl ' +
    '+towgs84=-265.8867,76.9851,20.2667,0.33746,3.09264,-2.53861,0.4598 ' +
    '+units=m +no_defs',
)

proj4.defs(
  'EPSG:3857',
  '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 ' +
    '+k=1 +units=m +nadgrids=@null +wktext +no_defs',
)

const round = (c: Coord, digits: number): Coord => {
  const f = 10 ** digits
  return [Math.round(c[0] * f) / f, Math.round(c[1] * f) / f]
}

/** Web Mercator -> WGS84 lon/lat. */
export const mercatorToLngLat = (c: Coord): Coord => round(proj4('EPSG:3857', 'EPSG:4326', c), 6)

/** WGS84 lon/lat -> Web Mercator. */
export const lngLatToMercator = (c: Coord): Coord => proj4('EPSG:4326', 'EPSG:3857', c)

/** WGS84 lon/lat -> LUREF (EPSG:2169). */
export const lngLatToLuref = (c: Coord): Coord => round(proj4('EPSG:4326', 'EPSG:2169', c), 2)

/** LUREF (EPSG:2169) -> WGS84 lon/lat. */
export const lurefToLngLat = (c: Coord): Coord => round(proj4('EPSG:2169', 'EPSG:4326', c), 6)

/** Web Mercator -> LUREF (EPSG:2169). */
export const mercatorToLuref = (c: Coord): Coord => round(proj4('EPSG:3857', 'EPSG:2169', c), 2)

/** LUREF (EPSG:2169) -> Web Mercator. */
export const lurefToMercator = (c: Coord): Coord => proj4('EPSG:2169', 'EPSG:3857', c)
