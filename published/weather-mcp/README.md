# weather-mcp

Unified weather server: NWS forecasts and alerts, USGS earthquakes, and FEMA disasters.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `forecast` — NWS forecast for coordinates.
- `activeAlerts` — Active NWS alerts for a state.
- `alertsForPoint` — Active alerts near coordinates.
- `earthquakes` — Recent USGS earthquakes.
- `femaDisasters` — Recent FEMA disaster declarations.

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
