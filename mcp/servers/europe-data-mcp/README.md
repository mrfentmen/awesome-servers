# EU Open Data MCP

Search the European Union open data portal. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/europe-data-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "europe-data-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/europe-data-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `datasets` | Search EU open datasets |

## Notes

The EU portal aggregates datasets from European institutions and member states. Titles are returned in English where available.

## Licence

MIT
