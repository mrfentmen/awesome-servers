# UNHCR Refugee Data

UNHCR forced displacement statistics: refugees, asylum seekers and stateless people by origin or country of asylum - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/unhcr-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "unhcr-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/unhcr-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `population_by_origin` | Displacement figures for one country of origin in a year. |
| `asylum_by_country` | Displacement figures for one country of asylum in a year. |
| `trends` | Year-by-year displacement totals for a country of origin. |

## Data source

UNHCR Refugee Population Statistics API
