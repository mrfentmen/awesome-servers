# NWS Alerts MCP

Active severe weather alerts for US states from the National Weather Service. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/nws-alerts-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "nws-alerts-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/nws-alerts-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `active_alerts` | Active weather alerts for a US state |

## Notes

State codes are two letters, e.g. CA or TX. An empty area returns alerts for the whole country.

## Licence

MIT
