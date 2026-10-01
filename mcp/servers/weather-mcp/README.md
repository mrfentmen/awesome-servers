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

<!-- paywall -->
## Premium tools

These tools need a license key:

* `alerts_for_area`
* `disasters_by_state`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-weather-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
