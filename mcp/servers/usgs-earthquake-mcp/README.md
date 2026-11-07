# USGS Earthquakes MCP

Recent earthquakes worldwide from the US Geological Survey feed. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/usgs-earthquake-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "usgs-earthquake-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/usgs-earthquake-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `recent_earthquakes` | Latest earthquakes, optionally above a magnitude |

## Notes

The USGS feed is updated every minute. Magnitudes are Richter scale; times are UTC.

## Licence

MIT
