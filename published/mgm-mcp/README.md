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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
