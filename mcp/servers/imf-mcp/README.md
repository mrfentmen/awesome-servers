# IMF DataMapper MCP

IMF economic indicators such as GDP and inflation by country and year. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/imf-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "imf-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/imf-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `indicator` | Values for one IMF indicator and country |

## Notes

Indicators use IMF codes, e.g. NGDPD for GDP in dollars, PCPIPCH for inflation. Countries use ISO three letter codes.

## Licence

MIT
