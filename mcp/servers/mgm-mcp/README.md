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

These tools need a licence key:

* `current_conditions`
* `province_board`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
