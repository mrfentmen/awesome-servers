# metoffice-mcp

UK Met Office DataHub: hourly, three-hourly and daily point forecasts for any lat/lon.

## Setup

```bash
export METOFFICE_API_KEY=YOUR_KEY
```

## Tools

- `get_hourly_forecast` — UK Met Office hourly forecast for a point: temperature, feels-like, rain probability, wind, gusts, visibility.
- `get_three_hourly_forecast` — UK Met Office three-hourly forecast steps for a point, longer range than hourly.
- `get_daily_forecast` — UK Met Office daily forecast for a point: day/night temperature, rain probability, wind summary.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
