# NOAA Buoys

NDBC ocean buoys and coastal stations: latest wind, wave and water temperatures, plus recent history - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ndbc-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ndbc-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ndbc-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `latest_observation` | Most recent observation from a buoy or coastal station. |
| `recent_observations` | Recent rows from a station's feed, newest first. |

## Data source

NOAA National Data Buoy Center realtime2 feeds
