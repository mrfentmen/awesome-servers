# Open-Meteo Geocoding MCP

Turn a place name into coordinates with the Open-Meteo geocoder. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/open-meteo-geocoding-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "open-meteo-geocoding-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/open-meteo-geocoding-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_places` | Find places by name |

## Notes

Search accepts city, region and country names in many languages. Results include population and timezone.

## Licence

MIT
