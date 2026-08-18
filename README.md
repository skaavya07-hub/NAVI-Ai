# NAVI-AI — Full JavaScript SIH 2026 PSS07

**Problem statement:** Development of a versatile and fast algorithm for optimal ship routing.

This edition is **100% JavaScript**: the routing algorithm, backend and frontend contain no Python.

## Stack

- **Node.js + Express** — REST API and live-data proxy
- **JavaScript multi-objective A\*** — routing engine
- **Leaflet + OpenStreetMap** — interactive world map
- **Open-Meteo** — live/continuously updated wind, wave and ocean-current forecast fusion
- **RainViewer** — weather-radar map layer
- **AISStream** — optional real-time vessel positions via backend WebSocket
- Vanilla HTML/CSS/JavaScript frontend — light theme, no framework build step

## What makes the algorithm the solution

NAVI-AI models the voyage as a time-dependent geographic graph. Each candidate segment is evaluated for voyage time, fuel and safety. The default objective is:

`J = wt * T_norm + wf * F_norm + ws * Risk^1.35 + constraint penalty`

Dangerous wind/wave/risk edges are rejected. A* uses an optimistic remaining-time heuristic, while Dijkstra is available as a benchmark.

The prototype uses a **hybrid live-aware approach**:

1. Dense A* candidate routes are generated quickly with the deterministic time-varying environmental field, so the demo always works offline.
2. Viable candidates are sampled against live Open-Meteo marine/weather forecasts.
3. Live wind, wave and ocean-current data recompute time/fuel/risk and re-rank the candidates for the selected objective.
4. If the public feed is unavailable, the optimizer falls back cleanly instead of failing.

This is a practical hackathon architecture: fast search + real external-data calibration, with a clear path to production gridded forecast ingestion.

## Features

- Fastest / Fuel Efficient / Safest / Balanced multi-objective profiles
- Custom time/fuel/safety weights
- Vessel-specific speed, fuel burn and preferred wave limit
- Time-dependent weather and current effects
- Hard safety constraints
- Live forecast fusion
- World map with global port context and Indian Ocean routing scope
- Weather radar overlay
- Optional live AIS vessels
- Dynamic re-routing as forecast conditions evolve
- A* vs Dijkstra benchmark
- Route telemetry table
- Download route as CSV, JSON and GeoJSON

## Run

Requires Node.js 18+.

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

For development:

```bash
npm run dev
```

Run the routing smoke test:

```bash
npm test
```

## Optional real-time AIS

Copy `.env.example` to `.env` and set:

```text
AISSTREAM_API_KEY=your_key_here
```

The API key stays on the **server**, never in browser JavaScript. Without it, the rest of NAVI-AI still works and the AIS toggle explains that the key is not configured.

## Suggested SIH demo

1. Start with **Mumbai → Colombo**, Balanced.
2. Compute the route and show the bold selected route plus alternative profiles.
3. Point out whether the **live Open-Meteo fusion** selected a different candidate.
4. Toggle **Weather radar**.
5. If an AISStream key is configured, toggle **Live AIS vessels**.
6. Open Decision Intelligence and explain the objective function and hard safety limits.
7. Export **GeoJSON** / **CSV** to demonstrate interoperability.
8. Open Dynamic Re-routing and advance the forecast by 24–48 hours.
9. Run the **A* vs Dijkstra** benchmark to demonstrate the speed-oriented algorithmic choice.

## Important limitations / production upgrade path

This is a hackathon decision-support prototype, not certified navigation software. The current land mask is deliberately lightweight for the Indian Ocean demo region. Production use should replace it with high-resolution coastline/ENC navigable-water data, traffic separation schemes, restricted zones and draught constraints.

For production, ingest gridded forecast fields once per model cycle rather than calling a public point API during requests; interpolate those fields inside A*. Add D* Lite/Lifelong Planning A* for incremental re-planning, Pareto-front route generation, forecast uncertainty, and ship-specific resistance/power curves calibrated from AIS + operational data.

## Live moving AIS vessels

1. Create a `.env` file in the project root (copy `.env.example`).
2. Set `AISSTREAM_API_KEY=your_key_here`.
3. Restart the Node server with `npm start`.
4. Turn on **Live AIS vessels** in Map layers.

The map keeps one marker per MMSI, rotates ships using true heading/course, smoothly interpolates each new AIS position report, displays vessel name/MMSI/speed/course/last update, counts active vessels, and removes stale markers after 10 minutes. AIS coverage depends on receiver coverage, so offshore areas can legitimately show fewer vessels.
