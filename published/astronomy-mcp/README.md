# Sun and Moon Almanac

Solar and lunar almanac offline: sunrise, sunset and twilight times, sun position and moon phase for any place and date - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/astronomy-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "astronomy-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/astronomy-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `solar_times` | Sunrise, sunset, solar noon, civil twilight and day length for a place and date. |
| `sun_position` | Sun altitude, azimuth, declination and subsolar point at an instant. |
| `moon_phase` | Moon phase name, illumination, age in days, and the next full and new moon dates. |

## Data source

NOAA solar position equations and low-precision Meeus sun/moon longitudes, computed locally
