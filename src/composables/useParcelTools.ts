import { getOl, WMS_URL, type LuxMap } from '../lib/geoportail'
import { lngLatToMercator, type Coord } from '../lib/projection'
import { formatDistance, formatParcelArea } from '../lib/format'
import type { InfoContent, InfoRow, SearchFeature } from '../lib/types'

/** Roodt (Redange) — 49°47′42″N 05°49′18″E — the project's home location. */
export const ROODT_LNGLAT: Coord = [5 + 49 / 60 + 18 / 3600, 49 + 47 / 60 + 42 / 3600]

const FIELD_LABELS: Record<string, string> = {
  textstring: 'Cadastral ID',
  num_cadast: 'Cadastral number',
  label: 'Location',
  name: 'Type',
  type: 'Type code',
  code_commu: 'Commune code',
}
const FIELD_ORDER = ['textstring', 'num_cadast', 'label', 'name', 'type', 'code_commu']

export interface ParcelToolsOptions {
  onInfo: (content: InfoContent | null) => void
  initialOpacity: number
}

export interface ParcelTools {
  setOpacity(value: number): void
  highlightSearch(feature: SearchFeature): void
  goToRoodt(): void
  destroy(): void
}

function wmsLayer(ol: any, layers: string, opacity: number) {
  return new ol.layer.Tile({
    source: new ol.source.TileWMS({
      url: WMS_URL,
      params: { LAYERS: layers, FORMAT: 'image/png', TRANSPARENT: true },
      projection: 'EPSG:3857',
    }),
    opacity,
  })
}

export function createParcelTools(map: LuxMap, { onInfo, initialOpacity }: ParcelToolsOptions): ParcelTools {
  const ol = getOl()

  const parcelsLayer = wmsLayer(ol, 'parcels', initialOpacity)
  const labelsLayer = wmsLayer(ol, 'parcels_labels', Math.min(1, initialOpacity + 0.3))
  map.addLayer(parcelsLayer)
  map.addLayer(labelsLayer)

  const highlightSource = new ol.source.Vector()
  const highlightLayer = new ol.layer.Vector({
    source: highlightSource,
    zIndex: 40,
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({ color: '#e5484d', width: 3 }),
      fill: new ol.style.Fill({ color: 'rgba(229,72,77,0.18)' }),
      image: new ol.style.Circle({
        radius: 8,
        fill: new ol.style.Fill({ color: '#e5484d' }),
        stroke: new ol.style.Stroke({ color: '#fff', width: 2 }),
      }),
    }),
  })
  map.addLayer(highlightLayer)

  const geojson = new ol.format.GeoJSON()
  const featureInfoFormat = new ol.format.WMSGetFeatureInfo()

  const clickKey = map.on('singleclick', (evt: { coordinate: Coord }) => {
    highlightSource.clear()
    // Ask for several features: a click near a boundary can return neighbours,
    // and we must highlight the parcel that actually contains the click point.
    const url = parcelsLayer
      .getSource()
      .getFeatureInfoUrl(evt.coordinate, map.getView().getResolution(), 'EPSG:3857', {
        INFO_FORMAT: 'text/xml',
        QUERY_LAYERS: 'parcels',
        FEATURE_COUNT: 10,
      })
    if (!url) return

    fetch(url)
      .then((r) => r.text())
      .then((text) => {
        const features = featureInfoFormat.readFeatures(text) as any[]
        if (!features.length) {
          onInfo(null)
          return
        }
        const feature =
          features.find((f) => f.getGeometry()?.intersectsCoordinate(evt.coordinate)) ?? features[0]
        const props = feature.getProperties() as Record<string, unknown>
        const rows: InfoRow[] = FIELD_ORDER.filter((f) => props[f] != null).map((f) => ({
          label: FIELD_LABELS[f] ?? f,
          value: String(props[f]),
        }))

        const geometry = feature.getGeometry()
        if (geometry) {
          highlightSource.addFeature(feature)
          const area = ol.sphere.getArea(geometry, { projection: 'EPSG:3857' })
          if (area > 0) {
            rows.push({ label: 'Area', value: formatParcelArea(area) })
            const perimeter = ol.sphere.getLength(geometry, { projection: 'EPSG:3857' })
            if (perimeter > 0) rows.push({ label: 'Perimeter', value: formatDistance(perimeter) })
          }
        }
        onInfo(rows.length ? { title: 'Parcel information', rows } : null)
      })
      .catch(() => onInfo(null))
  })

  return {
    setOpacity(value: number) {
      parcelsLayer.setOpacity(value)
      labelsLayer.setOpacity(Math.min(1, value + 0.3))
    },
    highlightSearch(feature: SearchFeature) {
      highlightSource.clear()
      const olFeature = geojson.readFeature(feature.raw, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      })
      const geometry = olFeature.getGeometry()
      if (geometry) {
        highlightSource.addFeature(olFeature)
        map.getView().fit(geometry.getExtent(), { padding: [80, 80, 80, 80], maxZoom: 19, duration: 600 })
      } else {
        // No geometry — still centre on the result's point if we have one.
        map.getView().animate({ center: lngLatToMercator(feature.lngLat), zoom: 18, duration: 600 })
      }
      const rows: InfoRow[] = [
        { label: 'Label', value: feature.label },
        { label: 'Layer', value: feature.layerName },
      ]
      if (feature.id) rows.push({ label: 'ID', value: feature.id })
      onInfo({ title: 'Parcel information', rows })
    },
    goToRoodt() {
      highlightSource.clear()
      const center = lngLatToMercator(ROODT_LNGLAT)
      map.getView().animate({ center, zoom: 17, duration: 800 })
      highlightSource.addFeature(new ol.Feature({ geometry: new ol.geom.Point(center) }))
      onInfo({
        title: 'Location',
        rows: [
          { label: 'Name', value: 'Roodt (Redange)' },
          { label: 'Coordinates', value: '49°47′42″N 05°49′18″E' },
          { label: 'Decimal', value: `${ROODT_LNGLAT[1].toFixed(5)}, ${ROODT_LNGLAT[0].toFixed(5)}` },
        ],
      })
    },
    destroy() {
      ol.Observable.unByKey(clickKey)
      map.removeLayer(parcelsLayer)
      map.removeLayer(labelsLayer)
      map.removeLayer(highlightLayer)
    },
  }
}
