# space-weather-mcp

Unified space weather server: solar wind, NOAA scales and alerts, aurora forecasts, and X-ray flux.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `solarWind` — Recent proton solar wind speed.
- `scales` — NOAA radio, solar, geomagnetic scales.
- `alerts` — Recent NOAA SWPC alerts.
- `auroraLatest` — Latest aurora observation times.
- `auroraMap` — Aurora forecast map coverage.
- `xrays` — Recent solar x ray flux.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
