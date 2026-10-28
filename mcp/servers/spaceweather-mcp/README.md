# Space Weather

NOAA space weather: planetary Kp index, aurora probability for a place and active alerts from SWPC - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/spaceweather-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "spaceweather-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/spaceweather-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `kp_index` | Recent planetary Kp values (3-hourly) and the geomagnetic storm level they imply. |
| `aurora_forecast` | Aurora visibility probability from the OVATION model, at a location or as a global summary. |
| `alerts` | The latest SWPC alerts and warnings with issue times and message text. |

## Data source

NOAA Space Weather Prediction Center JSON feeds (services.swpc.noaa.gov), no key required
