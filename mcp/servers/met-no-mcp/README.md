# MET Norway Forecast MCP

MET Norway (yr.no) forecast: current conditions, hourly and daily outlook, rain-only view — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y met-no-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "met-no-mcp": { "command": "npx", "args": ["-y", "met-no-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `current_conditions` | Temperature, wind, humidity and sky now |
| `hourly_forecast` | Hour by hour for up to 48 hours |
| `daily_forecast` | Daily min/max and total rain, up to 9 days |
| `rain_outlook` | Only hours with measurable precipitation |
| `compare_locations` | Two coordinates side by side |

## Example

```
Hourly forecast for 59.9139, 10.7522 — next 6 hours:

   2026-10-27 05:00    8.9°C  wind  4.8 m/s SSE  rain  0.4 mm
```

## Notes

MET Norway requires an identifying User-Agent, which this server sends on every request. Forecasts are coordinate-based with no geocoding, so pass latitude and longitude.

## Licence

MIT
