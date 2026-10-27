# Live Aircraft

Live ADS-B aircraft positions from adsb.lol: find traffic near a point or look up a callsign or ICAO hex - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/adsb-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "adsb-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/adsb-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `aircraft_near` | Aircraft currently within a radius of a latitude and longitude. |
| `aircraft_by_callsign` | Find aircraft broadcasting a callsign. |
| `aircraft_by_hex` | Find an aircraft by its 24-bit ICAO hex code. |

## Data source

adsb.lol community ADS-B network
