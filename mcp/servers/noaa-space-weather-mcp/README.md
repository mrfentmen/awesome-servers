# NOAA Space Weather MCP

Planetary K-index and solar wind readings from NOAA SWPC. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/noaa-space-weather-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "noaa-space-weather-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/noaa-space-weather-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `kp_index` | Latest planetary K-index readings |

## Notes

The Kp index runs from 0 to 9. Values of 5 or more mean a geomagnetic storm. Readings arrive every minute.

## Licence

MIT
