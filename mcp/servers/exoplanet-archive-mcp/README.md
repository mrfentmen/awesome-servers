# NASA Exoplanet Archive MCP

Confirmed exoplanets with host stars and discovery data from NASA. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/exoplanet-archive-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "exoplanet-archive-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/exoplanet-archive-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_planets` | Find exoplanets by name |

## Notes

Queries run through the archive TAP service. The table pscomppars holds one row per confirmed planet.

## Licence

MIT
