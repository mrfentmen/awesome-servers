# Zippopotam Postal Codes

Postal code lookup for 60+ countries: place names, state and coordinates from a ZIP or postcode - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/zippopotam-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "zippopotam-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/zippopotam-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `lookup_postcode` | Places behind one postal code, with coordinates. |
| `lookup_postcodes` | Look up several postal codes in one country at once. |
| `supported_countries` | The country codes this service can look postal codes up in. |

## Data source

Zippopotam.us free postal code API
