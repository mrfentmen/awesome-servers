# OpenLigaDB

German football results from OpenLigaDB: available leagues, fixtures by matchday and the current season - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/openligadb-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "openligadb-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/openligadb-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `leagues` | Every league and season OpenLigaDB holds. |
| `matches` | Matches for a league and season, optionally one matchday. |

## Data source

OpenLigaDB (community football data, mainly German leagues)
