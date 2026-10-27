# Brønnøysund Register

Norwegian company registry: search entities, read details and see registered roles - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/brreg-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "brreg-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/brreg-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_companies` | Search Norwegian registered entities by name. |
| `company_detail` | Read a company by organisation number. |
| `company_roles` | Board members, CEO and other registered roles. |

## Data source

Brønnøysund Register Centre open API
