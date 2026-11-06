# data.gov.sg MCP

Singapore's official two-hour weather forecast by area. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/data-gov-sg-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "data-gov-sg-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/data-gov-sg-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `forecast` | Two-hour weather forecast for every Singapore area |

## Notes

The forecast covers Singapore in two-hour blocks, split by planning area.

## Licence

MIT
