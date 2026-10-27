# SNOTEL Snowpack

USDA SNOTEL and SCAN stations: snow water equivalent, snow depth and temperature readings - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/snotel-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "snotel-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/snotel-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `stations_in_state` | Snow and soil stations in one state, with elevation and coordinates. |
| `station_readings` | Recent daily readings for one station: snow water equivalent, snow depth, precipitation, temperature. |

## Data source

USDA NRCS AWDB REST API (SNOTEL, SCAN and related networks)
