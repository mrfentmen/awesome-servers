# STRING Interactions

STRING protein networks: map identifiers and list interaction partners with confidence scores - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/string-db-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "string-db-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/string-db-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `map_identifiers` | Map gene names to STRING ids for a species. |
| `interaction_partners` | Top interaction partners of a protein, with combined scores. |

## Data source

STRING database API
