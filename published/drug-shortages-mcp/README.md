# drug-shortages-mcp

FDA drug shortage database: search shortages by drug, status, manufacturer or NDC - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/drug-shortages-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "drug-shortages-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/drug-shortages-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_shortages` | Search drug shortages by generic or brand name |
| `shortages_by_status` | Shortage records with a given availability status |
| `shortages_by_manufacturer` | Shortage records for one manufacturer |
| `shortage_by_ndc` | Shortage records for one package NDC |
| `search_by_brand` | Shortage records for a brand name |
| `shortage_stats` | Count of shortage records per availability status |

## Data source

openFDA Drug Shortages
