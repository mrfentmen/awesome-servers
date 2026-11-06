# Chicago Data MCP

Recent crime reports from the City of Chicago open data portal. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/chicago-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "chicago-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/chicago-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `recent_crimes` | Most recent crime reports in Chicago |

## Notes

This reads Chicago's public crime dataset (ijzp-q8t2) straight from the Socrata API. Records appear within days of the report.

## Licence

MIT
