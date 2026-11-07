# Open-Meteo Marine MCP

Wave height, period and sea temperature from the Open-Meteo marine API. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/open-meteo-marine-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "open-meteo-marine-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/open-meteo-marine-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `marine_conditions` | Current sea conditions for a coordinate |

## Notes

Coordinates must be over water. Values are hourly; the current block is the latest model hour.

## Licence

MIT
