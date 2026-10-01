# mgm-mcp

Keyless Turkish State Meteorological Service: provinces, districts, current weather, daily and hourly forecasts.

## Setup

No API key needed.

## Tools

- `list_provinces` — All Turkish provinces with center ids from MGM.
- `list_districts` — Districts of a province with station ids for forecasts (gunlukTahminIstNo) and current conditions (sondurumIstNo).
- `get_daily` — MGM multi-day forecast for a station. Use gunlukTahminIstNo from list_districts.
- `get_hourly` — MGM hourly forecast steps for a station.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `current_conditions`
* `province_board`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-mgm-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
