# bom-mcp

Keyless Australian Bureau of Meteorology forecasts by coordinates plus classic station observations.

## Setup

No API key needed.

## Tools

- `get_daily_forecast` — BOM 7-day daily forecast for coordinates: rain chance, min/max, UV, fire danger.
- `get_hourly_forecast` — BOM 3-hourly forecast steps for coordinates: temp, rain, wind, humidity.
- `get_observations` — Latest BOM station observations: temp, humidity, wind, pressure, rain. Product like IDN60901 (NSW), station like 94768 (Sydney).

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
