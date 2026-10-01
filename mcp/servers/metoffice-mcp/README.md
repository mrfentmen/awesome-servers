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
