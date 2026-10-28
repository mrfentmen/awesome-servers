# Air Quality MCP

Open-Meteo air quality: AQI, PM2.5, ozone, NO2 and pollen forecasts for any coordinate — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/air-quality-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "air-quality-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/air-quality-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `current_air_quality` | European/US AQI plus PM2.5, PM10, O₃, NO₂, SO₂, CO |
| `air_quality_forecast` | Hourly AQI and PM2.5 with the peak hour flagged |
| `pollutant_detail` | Every pollutant with its units |
| `pollen_forecast` | Alder, birch, grass, mugwort, olive and ragweed pollen |
| `compare_locations` | 2–5 places ranked from cleanest to worst |

## Example

```
Air quality at 52.5, 13.4 (Europe/Berlin) at 2026-10-27T07:00:
  European AQI: 30 — fair · US AQI 45
  PM2.5: 9.8 µg/m³ · PM10: 13.8 µg/m³
  NO₂: 15.6 µg/m³ · O₃: 37 µg/m³ · SO₂: 1.9 µg/m³ · CO: 200 µg/m³
```

## Notes

Uses the keyless Open-Meteo air-quality API (CAMS model data). European AQI
bands are spelled out in words so results are readable without a lookup table.
Pollen is only modelled in Europe and parts of North America.

## Licence

MIT
