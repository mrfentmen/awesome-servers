# Open Brewery DB MCP

Open Brewery DB: 8,000+ breweries by name, city, state, country or type, with map links — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y openbrewerydb-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "openbrewerydb-mcp": { "command": "npx", "args": ["-y", "openbrewerydb-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_breweries` | Free-text search by name |
| `breweries_by_state` | All breweries in a US state |
| `breweries_by_city` | All breweries in a city |
| `breweries_by_type` | Filter by brewery type |
| `breweries_by_country` | All breweries in a country |
| `brewery_detail` | Address, phone, website, map link |
| `random_breweries` | A random handful for discovery |

## Example

```
Breweries in California — showing 2 of 2 breweries:

1. 10 Barrel Brewing Co [large] · 32.7148,-117.1296
   1501 E St, San Diego, California, 92101-6618, United States
```

## Notes

State and country filters need the name spelled out in full — 'California', not 'CA'. The API answers a wrong value with 422, which this server turns into that hint.

## Licence

MIT
