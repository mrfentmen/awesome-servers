# Aircraft Database

Aircraft and route metadata: map a callsign to its flight route, or a hex code to the airframe - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/adsbdb-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "adsbdb-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/adsbdb-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `flight_route` | Airline, origin and destination for a callsign. |
| `aircraft_by_hex` | Airframe details from a 24-bit ICAO hex code. |
| `aircraft_by_registration` | Airframe details from a civil registration. |

## Data source

ADSBDB public API
