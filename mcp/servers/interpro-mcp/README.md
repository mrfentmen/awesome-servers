# InterPro

InterPro protein families and domains: search entries and find the domains in one protein - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/interpro-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "interpro-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/interpro-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_entries` | Search InterPro entries (families, domains, sites) by free text. |
| `protein_domains` | Every InterPro entry that matches one protein accession. |

## Data source

InterPro API (EBI)
