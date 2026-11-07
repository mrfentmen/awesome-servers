# NOAA Tides MCP

Water levels and tide observations from NOAA tide gauges. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/noaa-tides-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "noaa-tides-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/noaa-tides-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `water_level` | Latest water level at a tide station |

## Notes

Station ids are seven digits, e.g. 8454000 for Providence. Units can be english or metric.

## Licence

MIT
