# OurAirports

Global airport database: lookup by IATA or ICAO code, search by name or city, and find airports near a point - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ourairports-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ourairports-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ourairports-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `lookup_airport` | Find an airport by IATA, ICAO or internal ident code. |
| `search_airports` | Search airports by name, city or code fragment. |
| `airports_near` | Airports within a radius of a latitude and longitude. |

## Data source

OurAirports open data (public domain CSV)
