# synoptic-mcp

Synoptic weather stations: metadata search and time series from 170k+ stations. Needs token.

## Setup

```bash
export SYNOPTIC_API_TOKEN=...
```

## Tools

- `find_stations` — Synoptic weather stations by state with ids, names and coordinates.
- `get_timeseries` — Observations for stations: temp, wind, humidity and more.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `nws_station_timeseries`
* `nws_gridpoint_hourly`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-synoptic-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
