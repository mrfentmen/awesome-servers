# ExchangeRate-API MCP

Daily exchange rates for 160+ currencies, no key needed. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/er-api-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "er-api-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/er-api-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `convert` | Convert one currency to another using today's rate |

## Notes

Rates update once a day. The open endpoint returns the whole table, so one call converts any pair.

## Licence

MIT
