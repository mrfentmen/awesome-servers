# UN Comtrade MCP

International trade values between countries, from UN Comtrade. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/comtrade-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "comtrade-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/comtrade-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `trade` | Annual trade totals for one reporter country |

## Notes

The public preview endpoint is keyless and returns annual totals. Reporter codes are numeric, e.g. 842 is the USA, 156 is China, 0 means world.

## Licence

MIT
