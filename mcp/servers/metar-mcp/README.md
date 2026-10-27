# Aviation Weather

Live aviation weather from NOAA: current METAR observations, TAF forecasts and station records for airports worldwide - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/metar-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "metar-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/metar-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `metar` | Current METAR observation for one or more ICAO stations, decoded plus raw. |
| `taf` | Terminal aerodrome forecast for an ICAO station. |
| `station_info` | Airport station record: name, coordinates, elevation and which products it publishes. |

## Data source

NOAA / NWS Aviation Weather Center data API
