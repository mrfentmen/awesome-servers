# bmkg-mcp

Keyless BMKG Indonesia: village-level 3-hourly forecasts plus felt and latest earthquakes.

## Setup

No API key needed.

Please credit BMKG as the data source in your application (required by BMKG).

## Tools

- `get_forecast` — 3-hourly 3-day BMKG forecast for an Indonesian village by adm4 code (e.g. 31.71.03.1001 Kemayoran, Jakarta). Codes at kodewilayah.id.
- `get_felt_earthquakes` — Recently felt Indonesian earthquakes: magnitude, depth, location, MMI scale.
- `get_latest_earthquakes` — Latest Indonesian earthquakes M5+: time, coordinates, magnitude, region.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `latest_earthquake`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-bmkg-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
