# opensky-mcp

Live aircraft positions, flight tracks and airport arrivals from the OpenSky Network - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/opensky-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "opensky-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/opensky-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `aircraft_in_area` | Live aircraft inside a bounding box |
| `aircraft_state` | Latest state vector for one aircraft by ICAO24 |
| `flight_track` | Recent flight track (breadcrumb path) for an aircraft |
| `aircraft_near` | Aircraft within a radius of a point |
| `airport_arrivals` | Arrivals at an airport in a short time window |

## Data source

OpenSky Network
