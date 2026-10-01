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

These tools need a licence key:

* `latest_earthquake`
* `weather_warnings`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
