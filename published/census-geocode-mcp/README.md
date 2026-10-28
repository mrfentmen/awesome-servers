# census-geocode-mcp

US Census geocoder: addresses to coordinates, reverse geocoding and census geography lookup - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/census-geocode-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "census-geocode-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/census-geocode-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `geocode_oneline` | Geocode a single-line US address |
| `geocode_address` | Geocode a structured US address |
| `congressional_district` | Congressional district for a coordinate |
| `geographies` | Census geographies (state, county, tract, block group) for a coordinate |
| `benchmarks` | Available Census geocoder benchmarks and vintages |

## Data source

US Census Geocoder
