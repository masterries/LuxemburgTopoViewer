# Luxembourg Topo Viewer

An interactive viewer for Luxembourg **topographic maps**, **elevation profiles**
and **cadastral parcels**, built on the official [Geoportail.lu](https://map.geoportail.lu)
data services.

**Live demo:** <https://masterries.github.io/LuxemburgTopoViewer/>

![Vue](https://img.shields.io/badge/Vue-3-42b883) ![Vite](https://img.shields.io/badge/Vite-6-646cff) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)

## Features

Two apps share one map workspace; switch between them with the **Parcels / Topo**
tabs (and a `?app=` URL parameter).

### Parcel search (`?app=parcels`)
- Search cadastral parcels and highlight them on the map
- Click any parcel to read its cadastral information (id, number, location, type)
- Adjustable parcel-layer opacity
- Jump to Roodt (Redange)

### Topographic map (`?app=topo`)
- **Rich elevation profiles** — draw a line and get a distance/elevation chart
  with total **ascent & descent**, **min / max / average** elevation, and a
  marker that follows your cursor along the chart back onto the map
- Contour lines and points-of-interest overlays
- Place search across Luxembourg

### Shared tools
- **Aerial time-comparison** — swipe between two orthophoto vintages (2001–2025) with a draggable divider to see how an area changed
- **PAG zoning overlay** — toggle the official *Plan d'Aménagement Général* (land-use plan) with its legend
- **Multiple backgrounds** — Streets, Topographic, latest Aerial, Basemap
- **Measure** distance and area
- **Live cursor coordinates** in WGS84 (DMS) and LUREF (EPSG:2169), copy to clipboard
- **GPS** — locate yourself and record a route (with live length)
- **Shareable links** — the map view (centre, zoom, layers) is encoded in the URL;
  the 🔗 button copies a permalink
- **Dark mode**, fullscreen, and a responsive, mobile-friendly layout

## Tech stack

- **Vue 3** + **TypeScript** + **Vite**
- **OpenLayers** via the official [Geoportail.lu API v4](https://apiv4.geoportail.lu)
  (loaded as a global script; wrapped behind a typed service layer)
- **Chart.js** for elevation profiles
- **proj4** for WGS84 ⇄ Web Mercator ⇄ LUREF (EPSG:2169) conversions

## Development

```bash
npm install     # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check and build to dist/
npm run preview  # preview the production build
```

No API key is required — all data comes from the public Geoportail.lu services.

## Deployment

The site deploys to GitHub Pages automatically via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to
`main`. The build uses a relative base path, so it works under the
`/LuxemburgTopoViewer/` project sub-path without further configuration.

**One-time setup:** in the repository's **Settings → Pages**, set the **Source**
to **GitHub Actions**.

## Project structure

```
src/
  lib/          API wrappers, projections, formatting, URL state, types
  composables/  map lifecycle, geolocation, measure, elevation profile,
                background, parcel tools, theme, toasts
  components/   reusable UI (panels, toolbar, search, chart, …)
  views/        ParcelView, TopoView
legacy/         the original single-file HTML apps (kept for reference)
```

## Notes on the Geoportail API

The Geoportail apiv4 catalog has shifted over time. A couple of things this app
works around, documented here so they don't surprise future maintainers:

- The old elevation endpoint `/1.0/profile` is gone; profiles now come from
  `POST /profile.json` with the geometry in **LUREF (EPSG:2169)**.
- Several legacy background-layer ids (`topo_bw`, `ortho_latest`, …) no longer
  exist, and `lux.setBackground` currently routes through a broken vector
  pipeline — so backgrounds are built as raster `WMTS` sources straight from the
  published [WMTS capabilities](https://wmts.geoportail.lu/mapproxy_4_v3/wmts/1.0.0/WMTSCapabilities.xml).

---

Originally developed by [masterries](https://github.com/masterries); modernised
into a Vue 3 + TypeScript application.
