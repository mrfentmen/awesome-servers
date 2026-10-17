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


