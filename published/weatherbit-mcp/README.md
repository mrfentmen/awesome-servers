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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
