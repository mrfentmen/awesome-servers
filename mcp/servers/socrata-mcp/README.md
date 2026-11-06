# Socrata MCP

Search the Socrata catalogue of US city, state and federal datasets. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/socrata-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "socrata-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/socrata-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `catalog` | Search Socrata open datasets |

## Notes

Socrata powers open data portals for New York, Chicago, Seattle and many US agencies. Results show the portal domain and dataset name.

## Licence

MIT
