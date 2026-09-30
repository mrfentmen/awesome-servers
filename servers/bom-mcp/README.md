# bom-mcp

Keyless Australian Bureau of Meteorology forecasts by coordinates plus classic station observations.

## Setup

No API key needed.

## Tools

- `get_daily_forecast` — BOM 7-day daily forecast for coordinates: rain chance, min/max, UV, fire danger.
- `get_hourly_forecast` — BOM 3-hourly forecast steps for coordinates: temp, rain, wind, humidity.
- `get_observations` — Latest BOM station observations: temp, humidity, wind, pressure, rain. Product like IDN60901 (NSW), station like 94768 (Sydney).

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `forecast_table`
* `forecast_hazards`
* `resolve_location`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
