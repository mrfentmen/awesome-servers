# CRAN MCP

R package metadata from the CRAN database. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/crandb-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "crandb-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/crandb-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `package` | Details for one CRAN package |

## Notes

crandb mirrors the CRAN package database. Pass an exact package name such as ggplot2.

## Licence

MIT
