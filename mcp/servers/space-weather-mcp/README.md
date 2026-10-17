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


