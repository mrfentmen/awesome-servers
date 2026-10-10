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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `planetary_k_index`
* `solar_wind_mag_field`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
