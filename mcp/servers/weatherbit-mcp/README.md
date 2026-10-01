# weatherbit-mcp

Weatherbit API: current conditions, daily and hourly forecasts, severe alerts, air quality.

## Setup

```bash
export WEATHERBIT_API_KEY=...
```

## Tools

- `get_current` — Current Weatherbit conditions: temperature, feels-like, humidity, wind, clouds, UV, visibility.
- `get_daily_forecast` — Weatherbit daily forecast: highs/lows, rain chance, snow, wind, UV per day.
- `get_hourly_forecast` — Weatherbit hourly forecast steps: temperature, precipitation, wind, humidity.
- `get_alerts` — Active Weatherbit severe weather alerts for a point: title, severity, description, timing.
- `get_air_quality` — Current Weatherbit air quality: AQI, PM2.5, PM10, ozone, NO2, SO2, CO.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `nws_point_forecast`
* `open_meteo_air_quality`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-weatherbit-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
